package com.vixen.product.model;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class ProductVariant {
    private String color;
    private Double price;
    private List<String> images;
    private Map<String, Integer> sizes;
}