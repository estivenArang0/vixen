package com.vixen.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import jakarta.validation.constraints.Min;

import java.math.BigDecimal;
import java.util.List;
import com.vixen.product.model.ProductVariant;

@Data
public class ProductDTO {
    private String id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Category is required")
    private String category;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private BigDecimal price;

    @NotNull(message = "Stock quantity is required")
    @Min(value = 0, message = "Stock quantity cannot be negative")
    private Integer stockQuantity;

    private List<String> images;
    private List<ProductVariant> variants;

    @NotBlank(message = "Brand is required")
    private String brand;

    private Double rating;
    private Integer reviewCount;
    private boolean active;

    @NotBlank(message = "SKU is required")
    private String sku;

    private List<String> tags;
    private List<String> specifications;
}