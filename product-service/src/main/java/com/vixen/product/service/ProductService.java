package com.vixen.product.service;

import com.vixen.product.dto.ProductDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface ProductService {
    ProductDTO createProduct(ProductDTO productDTO);
    ProductDTO updateProduct(String id, ProductDTO productDTO);
    void deleteProduct(String id);
    Optional<ProductDTO> getProductById(String id);
    Optional<ProductDTO> getProductBySku(String sku);
    Optional<ProductDTO> getProductBySlug(String slug);
    List<ProductDTO> getAllProducts();
    Page<ProductDTO> getAllProducts(Pageable pageable);
    List<ProductDTO> getProductsByCategory(String categoryId);
    List<ProductDTO> getProductsByBrand(String brand);
    List<ProductDTO> getActiveProducts();
    void updateStock(String id, int quantity);
    void updateRating(String id, double rating);
}
