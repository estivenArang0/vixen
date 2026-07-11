package com.vixen.product.service;

import com.vixen.product.dto.CategoryDTO;

import java.util.List;
import java.util.Optional;

public interface CategoryService {
    CategoryDTO createCategory(CategoryDTO categoryDTO);
    CategoryDTO updateCategory(String id, CategoryDTO categoryDTO);
    void deleteCategory(String id);
    Optional<CategoryDTO> getCategoryById(String id);
    List<CategoryDTO> getAllCategories();
    List<CategoryDTO> getCategoryTree();
    List<CategoryDTO> getChildren(String parentId);
    List<CategoryDTO> getBreadcrumb(String categoryId);
}
