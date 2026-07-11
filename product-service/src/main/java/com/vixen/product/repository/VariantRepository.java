package com.vixen.product.repository;

import com.vixen.common.repository.BaseRepository;
import com.vixen.product.model.Variant;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VariantRepository extends BaseRepository<Variant> {
    List<Variant> findByProductId(String productId);
    Optional<Variant> findBySku(String sku);
    List<Variant> findByColor(String color);
    List<Variant> findByProductIdAndActive(String productId, boolean active);
}
