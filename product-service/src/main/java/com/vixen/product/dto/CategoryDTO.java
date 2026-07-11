package com.vixen.product.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class CategoryDTO {
    private String id;

    @NotBlank(message = "Category name is required")
    private String name;

    private String slug;

    private String parentId;

    private Integer level;

    private Integer sortOrder;

    private String image;

    private boolean active = true;

    private String description;

    private List<CategoryDTO> children = new ArrayList<>();
}
