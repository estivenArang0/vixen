package com.vixen.product.service.impl;

import com.vixen.common.exception.BadRequestException;
import com.vixen.common.exception.ResourceNotFoundException;
import com.vixen.product.dto.ProductDTO;
import com.vixen.product.mapper.ProductMapper;
import com.vixen.product.model.Product;
import com.vixen.product.repository.ProductRepository;
import com.vixen.product.repository.elasticsearch.ProductElasticsearchRepository;
import com.vixen.product.service.ProductService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ProductServiceImpl implements ProductService {
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private ProductElasticsearchRepository elasticsearchRepository;

    @Autowired
    public ProductServiceImpl(ProductRepository productRepository, ProductMapper productMapper) {
        this.productRepository = productRepository;
        this.productMapper = productMapper;
    }

    @Autowired(required = false)
    public void setElasticsearchRepository(ProductElasticsearchRepository elasticsearchRepository) {
        this.elasticsearchRepository = elasticsearchRepository;
        log.info("Elasticsearch repository is available");
    }

    @Override
    @Transactional
    public ProductDTO createProduct(ProductDTO productDTO) {
        log.info("Creating new product: {}", productDTO.getName());

        if (productRepository.existsBySku(productDTO.getSku())) {
            throw new BadRequestException("Product with SKU " + productDTO.getSku() + " already exists");
        }

        // Auto-generate slug from name if not provided
        if (productDTO.getSlug() == null || productDTO.getSlug().isBlank()) {
            productDTO.setSlug(generateSlug(productDTO.getName()));
        }

        Product product = productMapper.toEntity(productDTO);
        product.setCategoryId(productDTO.getCategoryId());
        product = productRepository.save(product);
        indexToElasticsearch(product);
        log.info("Product created successfully with id: {}", product.getId());
        return productMapper.toDTO(product);
    }

    @Override
    @Transactional
    public ProductDTO updateProduct(String id, ProductDTO productDTO) {
        log.info("Updating product with id: {}", id);

        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        // Update slug if name changed
        if (productDTO.getName() != null && !productDTO.getName().equals(existingProduct.getName())) {
            productDTO.setSlug(generateSlug(productDTO.getName()));
        }

        Product updatedProduct = productMapper.toEntity(productDTO);
        updatedProduct.setId(existingProduct.getId());
        updatedProduct.setCategoryId(productDTO.getCategoryId());
        updatedProduct.setCreatedAt(existingProduct.getCreatedAt());
        updatedProduct = productRepository.save(updatedProduct);
        indexToElasticsearch(updatedProduct);
        log.info("Product updated successfully: {}", id);
        return productMapper.toDTO(updatedProduct);
    }

    @Override
    @Transactional
    public void deleteProduct(String id) {
        log.info("Deleting product with id: {}", id);
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product not found with id: " + id);
        }
        productRepository.deleteById(id);
        if (elasticsearchRepository != null) {
            try {
                elasticsearchRepository.deleteById(id);
            } catch (Exception e) {
                log.warn("Failed to delete product from Elasticsearch index: {}", id, e);
            }
        }
    }

    @Override
    public Optional<ProductDTO> getProductById(String id) {
        log.info("Getting product with id: {}", id);
        return productRepository.findById(id)
                .map(productMapper::toDTO);
    }

    @Override
    public Optional<ProductDTO> getProductBySku(String sku) {
        log.info("Getting product with SKU: {}", sku);
        return productRepository.findBySku(sku)
                .map(productMapper::toDTO);
    }

    @Override
    public Optional<ProductDTO> getProductBySlug(String slug) {
        log.info("Getting product with slug: {}", slug);
        return productRepository.findBySlug(slug)
                .map(productMapper::toDTO);
    }

    @Override
    public List<ProductDTO> getAllProducts() {
        log.info("Getting all products");
        return productRepository.findAll().stream()
                .map(productMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public Page<ProductDTO> getAllProducts(Pageable pageable) {
        log.info("Getting all products with pagination");
        return productRepository.findAll(pageable)
                .map(productMapper::toDTO);
    }

    @Override
    public List<ProductDTO> getProductsByCategory(String categoryId) {
        log.info("Getting products by categoryId: {}", categoryId);
        return productRepository.findByCategoryId(categoryId).stream()
                .map(productMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductDTO> getProductsByBrand(String brand) {
        log.info("Getting products by brand: {}", brand);
        return productRepository.findByBrand(brand).stream()
                .map(productMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductDTO> getActiveProducts() {
        log.info("Getting active products");
        return productRepository.findByActiveTrue().stream()
                .map(productMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateStock(String id, int quantity) {
        log.info("Updating stock: stock management is now handled via VariantService for product: {}", id);
        // Stock is now managed per-variant through VariantService
        throw new BadRequestException(
                "Stock management is now handled per variant. Use /api/v1/variants/{id}/stock endpoint.");
    }

    @Override
    @Transactional
    public void updateRating(String id, double rating) {
        log.info("Updating rating for product with id: {}", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        product.setRating(rating);
        product = productRepository.save(product);
        indexToElasticsearch(product);
    }

    private void indexToElasticsearch(Product product) {
        if (elasticsearchRepository == null) return;
        try {
            elasticsearchRepository.save(product);
        } catch (Exception e) {
            log.warn("Failed to index product in Elasticsearch: {}", product.getId(), e);
        }
    }

    private String generateSlug(String name) {
        return name.toLowerCase()
                .trim()
                .replaceAll("[^a-z0-9áéíóúüñ\\s-]", "")
                .replaceAll("á", "a")
                .replaceAll("é", "e")
                .replaceAll("í", "i")
                .replaceAll("ó", "o")
                .replaceAll("ú", "u")
                .replaceAll("ü", "u")
                .replaceAll("ñ", "n")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
