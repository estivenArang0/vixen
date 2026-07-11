package com.vixen.product.service.impl;

import com.vixen.common.exception.BadRequestException;
import com.vixen.common.exception.ResourceNotFoundException;
import com.vixen.product.dto.VariantDTO;
import com.vixen.product.mapper.VariantMapper;
import com.vixen.product.model.Product;
import com.vixen.product.model.Variant;
import com.vixen.product.repository.ProductRepository;
import com.vixen.product.repository.VariantRepository;
import com.vixen.product.repository.elasticsearch.VariantElasticsearchRepository;
import com.vixen.product.service.VariantService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
public class VariantServiceImpl implements VariantService {

    private final VariantRepository variantRepository;
    private final VariantMapper variantMapper;
    private final ProductRepository productRepository;
    private VariantElasticsearchRepository elasticsearchRepository;

    @Autowired
    public VariantServiceImpl(VariantRepository variantRepository,
                              VariantMapper variantMapper,
                              ProductRepository productRepository) {
        this.variantRepository = variantRepository;
        this.variantMapper = variantMapper;
        this.productRepository = productRepository;
    }

    @Autowired(required = false)
    public void setElasticsearchRepository(VariantElasticsearchRepository elasticsearchRepository) {
        this.elasticsearchRepository = elasticsearchRepository;
        log.info("Variant Elasticsearch repository is available");
    }

    @Override
    @Transactional
    public VariantDTO createVariant(VariantDTO variantDTO) {
        log.info("Creating variant with SKU: {}", variantDTO.getSku());

        // Validate product exists
        Product product = productRepository.findById(variantDTO.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + variantDTO.getProductId()));

        // Validate SKU uniqueness
        if (variantRepository.findBySku(variantDTO.getSku()).isPresent()) {
            throw new BadRequestException("Variant with SKU '" + variantDTO.getSku() + "' already exists");
        }

        // Calculate discount percentage if originalPrice is set
        if (variantDTO.getOriginalPrice() != null
                && variantDTO.getOriginalPrice().compareTo(variantDTO.getPrice()) > 0) {
            double discount = variantDTO.getOriginalPrice().doubleValue() - variantDTO.getPrice().doubleValue();
            double percentage = (discount / variantDTO.getOriginalPrice().doubleValue()) * 100;
            variantDTO.setDiscountPercentage(Math.round(percentage * 100.0) / 100.0);
        }

        Variant variant = variantMapper.toEntity(variantDTO);
        variant = variantRepository.save(variant);

        // Auto-generate product slug if needed
        if (product.getSlug() == null || product.getSlug().isBlank()) {
            String slug = product.getName().toLowerCase()
                    .trim()
                    .replaceAll("[^a-z0-9áéíóúüñ\\s-]", "")
                    .replaceAll("á", "a").replaceAll("é", "e")
                    .replaceAll("í", "i").replaceAll("ó", "o")
                    .replaceAll("ú", "u").replaceAll("ü", "u")
                    .replaceAll("ñ", "n")
                    .replaceAll("\\s+", "-")
                    .replaceAll("-+", "-")
                    .replaceAll("^-|-$", "");
            product.setSlug(slug);
            productRepository.save(product);
        }

        // Update product min/max price
        updateProductPriceRange(variant.getProductId());

        indexToElasticsearch(variant);

        VariantDTO result = variantMapper.toDTO(variant);
        result.setProductName(product.getName());
        result.setProductSlug(product.getSlug());

        log.info("Variant created successfully with id: {}", variant.getId());
        return result;
    }

    @Override
    @Transactional
    public VariantDTO updateVariant(String id, VariantDTO variantDTO) {
        log.info("Updating variant with id: {}", id);

        Variant existing = variantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found with id: " + id));

        Product product = productRepository.findById(existing.getProductId())
                .orElse(null);

        // Check SKU uniqueness if changed
        if (variantDTO.getSku() != null && !variantDTO.getSku().equals(existing.getSku())) {
            if (variantRepository.findBySku(variantDTO.getSku()).isPresent()) {
                throw new BadRequestException("Variant with SKU '" + variantDTO.getSku() + "' already exists");
            }
        }

        // Recalculate discount if prices changed
        if (variantDTO.getOriginalPrice() != null && variantDTO.getPrice() != null
                && variantDTO.getOriginalPrice().compareTo(variantDTO.getPrice()) > 0) {
            double discount = variantDTO.getOriginalPrice().doubleValue() - variantDTO.getPrice().doubleValue();
            double percentage = (discount / variantDTO.getOriginalPrice().doubleValue()) * 100;
            variantDTO.setDiscountPercentage(Math.round(percentage * 100.0) / 100.0);
        }

        Variant updated = variantMapper.toEntity(variantDTO);
        updated.setId(existing.getId());
        updated.setCreatedAt(existing.getCreatedAt());
        updated = variantRepository.save(updated);

        // Update product price range
        updateProductPriceRange(updated.getProductId());
        indexToElasticsearch(updated);

        VariantDTO result = variantMapper.toDTO(updated);
        if (product != null) {
            result.setProductName(product.getName());
            result.setProductSlug(product.getSlug());
        }
        return result;
    }

    @Override
    @Transactional
    public void deleteVariant(String id) {
        log.info("Deleting variant with id: {}", id);

        Variant variant = variantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found with id: " + id));

        String productId = variant.getProductId();
        variantRepository.delete(variant);

        if (elasticsearchRepository != null) {
            try {
                elasticsearchRepository.deleteById(id);
            } catch (Exception e) {
                log.warn("Failed to delete variant from Elasticsearch index: {}", id, e);
            }
        }

        // Update product price range
        updateProductPriceRange(productId);
        log.info("Variant deleted successfully: {}", id);
    }

    @Override
    public Optional<VariantDTO> getVariantById(String id) {
        log.info("Getting variant by id: {}", id);
        return variantRepository.findById(id)
                .map(this::enrichWithProductInfo);
    }

    @Override
    public Optional<VariantDTO> getVariantBySku(String sku) {
        log.info("Getting variant by SKU: {}", sku);
        return variantRepository.findBySku(sku)
                .map(this::enrichWithProductInfo);
    }

    @Override
    public List<VariantDTO> getVariantsByProduct(String productId) {
        log.info("Getting variants for product: {}", productId);
        return variantRepository.findByProductIdAndActive(productId, true).stream()
                .map(this::enrichWithProductInfo)
                .collect(Collectors.toList());
    }

    @Override
    public List<VariantDTO> getAllVariants() {
        log.info("Getting all variants");
        return variantRepository.findAll().stream()
                .map(this::enrichWithProductInfo)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public VariantDTO updateStock(String variantId, int quantity) {
        log.info("Updating stock for variant {}: {}", variantId, quantity);

        Variant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found with id: " + variantId));

        if (quantity < variant.getReservedStock()) {
            throw new BadRequestException(
                    "Cannot set stock below reserved stock. Current reserved: " + variant.getReservedStock());
        }

        variant.setStock(quantity);
        variant = variantRepository.save(variant);
        indexToElasticsearch(variant);
        return enrichWithProductInfo(variant);
    }

    @Override
    @Transactional
    public VariantDTO reserveStock(String variantId, int quantity) {
        log.info("Reserving stock for variant {}: {}", variantId, quantity);

        Variant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found with id: " + variantId));

        int availableStock = variant.getStock() - variant.getReservedStock();
        if (quantity > availableStock) {
            throw new BadRequestException(
                    "Insufficient stock. Available: " + availableStock + ", requested: " + quantity);
        }

        variant.setReservedStock(variant.getReservedStock() + quantity);
        variant = variantRepository.save(variant);
        indexToElasticsearch(variant);
        return enrichWithProductInfo(variant);
    }

    @Override
    @Transactional
    public VariantDTO releaseStock(String variantId, int quantity) {
        log.info("Releasing stock for variant {}: {}", variantId, quantity);

        Variant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found with id: " + variantId));

        int newReserved = variant.getReservedStock() - quantity;
        if (newReserved < 0) {
            throw new BadRequestException("Cannot release more stock than reserved. Reserved: "
                    + variant.getReservedStock() + ", releasing: " + quantity);
        }

        variant.setReservedStock(newReserved);
        variant = variantRepository.save(variant);
        indexToElasticsearch(variant);
        return enrichWithProductInfo(variant);
    }

    private VariantDTO enrichWithProductInfo(Variant variant) {
        VariantDTO dto = variantMapper.toDTO(variant);
        productRepository.findById(variant.getProductId()).ifPresent(product -> {
            dto.setProductName(product.getName());
            dto.setProductSlug(product.getSlug());
        });
        return dto;
    }

    private void updateProductPriceRange(String productId) {
        productRepository.findById(productId).ifPresent(product -> {
            List<Variant> activeVariants = variantRepository.findByProductIdAndActive(productId, true);
            if (!activeVariants.isEmpty()) {
                java.math.BigDecimal min = activeVariants.stream()
                        .map(Variant::getPrice)
                        .min(java.math.BigDecimal::compareTo)
                        .orElse(null);
                java.math.BigDecimal max = activeVariants.stream()
                        .map(Variant::getPrice)
                        .max(java.math.BigDecimal::compareTo)
                        .orElse(null);
                product.setMinPrice(min);
                product.setMaxPrice(max);
            } else {
                product.setMinPrice(null);
                product.setMaxPrice(null);
            }
            productRepository.save(product);
        });
    }

    private void indexToElasticsearch(Variant variant) {
        if (elasticsearchRepository == null) return;
        try {
            elasticsearchRepository.save(variant);
        } catch (Exception e) {
            log.warn("Failed to index variant in Elasticsearch: {}", variant.getId(), e);
        }
    }
}
