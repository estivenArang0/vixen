package com.vixen.product.repository.elasticsearch;

import com.vixen.product.model.Product;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductElasticsearchRepository extends ElasticsearchRepository<Product, String> {
    List<Product> findByCategory(String category);
    List<Product> findByBrand(String brand);
    List<Product> findByActive(boolean active);
} 