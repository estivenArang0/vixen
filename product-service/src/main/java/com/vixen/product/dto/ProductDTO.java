package com.vixen.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class ProductDTO {
    private String id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Description is required")
    private String description;

    private String slug;

    @NotBlank(message = "Category ID is required")
    private String categoryId;

    private List<String> images;

    @NotBlank(message = "Brand is required")
    private String brand;

    private Double rating;
    private Integer reviewCount;
    private boolean active;

    @NotBlank(message = "SKU is required")
    private String sku;

    private List<String> tags;
    private List<String> specifications;

    private BigDecimal minPrice;
    private BigDecimal maxPrice;

    private Double weight;

    private SeoMetadataDTO seo;
    private DimensionsDTO dimensions;
    private Map<String, String> attributes;

    @Data
    public static class SeoMetadataDTO {
        private String title;
        private String description;
        private List<String> keywords;
    }

    @Data
    public static class DimensionsDTO {
        private Double length;
        private Double width;
        private Double height;
    }
}
