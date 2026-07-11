package com.vixen.product.repository.elasticsearch;

import com.vixen.product.model.Variant;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VariantElasticsearchRepository extends ElasticsearchRepository<Variant, String> {
    List<Variant> findByColor(String color);
    List<Variant> findByActive(boolean active);
    List<Variant> findByProductId(String productId);
}
