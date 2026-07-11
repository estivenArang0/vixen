package com.vixen.product.service;

import com.vixen.product.dto.VariantDTO;

import java.util.List;
import java.util.Optional;

public interface VariantService {
    VariantDTO createVariant(VariantDTO variantDTO);
    VariantDTO updateVariant(String id, VariantDTO variantDTO);
    void deleteVariant(String id);
    Optional<VariantDTO> getVariantById(String id);
    Optional<VariantDTO> getVariantBySku(String sku);
    List<VariantDTO> getVariantsByProduct(String productId);
    List<VariantDTO> getAllVariants();
    VariantDTO updateStock(String variantId, int quantity);
    VariantDTO reserveStock(String variantId, int quantity);
    VariantDTO releaseStock(String variantId, int quantity);
}
