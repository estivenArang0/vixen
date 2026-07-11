package com.vixen.product.repository;

import com.vixen.common.repository.BaseRepository;
import com.vixen.product.model.Product;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends BaseRepository<Product> {
    Optional<Product> findBySku(String sku);
    Optional<Product> findBySlug(String slug);
    List<Product> findByCategoryId(String categoryId);
    List<Product> findByBrand(String brand);
    List<Product> findByActiveTrue();
    boolean existsBySku(String sku);
}
