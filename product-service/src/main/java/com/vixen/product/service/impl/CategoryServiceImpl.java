package com.vixen.product.service.impl;

import com.vixen.common.exception.BadRequestException;
import com.vixen.common.exception.ResourceNotFoundException;
import com.vixen.product.dto.CategoryDTO;
import com.vixen.product.mapper.CategoryMapper;
import com.vixen.product.model.Category;
import com.vixen.product.repository.CategoryRepository;
import com.vixen.product.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    private static int compareCategories(Category a, Category b) {
        int aOrder = a.getSortOrder() != null ? a.getSortOrder() : 0;
        int bOrder = b.getSortOrder() != null ? b.getSortOrder() : 0;
        int cmp = Integer.compare(aOrder, bOrder);
        if (cmp != 0) return cmp;
        return a.getName().compareToIgnoreCase(b.getName());
    }

    private static final Comparator<Category> SORT = CategoryServiceImpl::compareCategories;

    @Override
    @Transactional
    public CategoryDTO createCategory(CategoryDTO dto) {
        log.info("Creating category: {}", dto.getName());
        if (dto.getSlug() == null || dto.getSlug().isBlank()) {
            dto.setSlug(generateSlug(dto.getName()));
        }
        if (categoryRepository.findBySlug(dto.getSlug()).isPresent()) {
            throw new BadRequestException("Category slug already exists: " + dto.getSlug());
        }
        if (dto.getParentId() != null && !dto.getParentId().isBlank()) {
            Category parent = categoryRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent not found"));
            dto.setLevel(parent.getLevel() + 1);
        } else {
            dto.setLevel(0);
            dto.setParentId(null);
        }
        return categoryMapper.toDTO(categoryRepository.save(categoryMapper.toEntity(dto)));
    }

    @Override
    @Transactional
    public CategoryDTO updateCategory(String id, CategoryDTO dto) {
        Category existing = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));
        if (dto.getName() != null && !dto.getName().isBlank()) {
            String slug = generateSlug(dto.getName());
            if (!slug.equals(existing.getSlug()) && categoryRepository.findBySlug(slug).isPresent()) {
                throw new BadRequestException("Slug already exists: " + slug);
            }
            dto.setSlug(slug);
        }
        Category updated = categoryMapper.toEntity(dto);
        updated.setId(existing.getId());
        updated.setCreatedAt(existing.getCreatedAt());
        return categoryMapper.toDTO(categoryRepository.save(updated));
    }

    @Override
    @Transactional
    public void deleteCategory(String id) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));
        if (!categoryRepository.findByParentId(id).isEmpty()) {
            throw new BadRequestException("Cannot delete category with children.");
        }
        categoryRepository.delete(cat);
    }

    @Override
    public Optional<CategoryDTO> getCategoryById(String id) {
        return categoryRepository.findById(id).map(categoryMapper::toDTO);
    }

    @Override
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(categoryMapper::toDTO)
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    public List<CategoryDTO> getCategoryTree() {
        List<Category> all = categoryRepository.findAll();
        List<CategoryDTO> result = new ArrayList<>();
        for (Category c : all) {
            if (c.getParentId() == null || c.getParentId().isBlank()) {
                result.add(buildTree(c, all));
            }
        }
        result.sort(CategoryServiceImpl::compareDto);
        return result;
    }

    @Override
    public List<CategoryDTO> getChildren(String parentId) {
        return categoryRepository.findByParentId(parentId).stream()
                .map(categoryMapper::toDTO)
                .collect(java.util.stream.Collectors.toList());
    }

   @Override
public List<CategoryDTO> getBreadcrumb(String categoryId) {
    List<CategoryDTO> breadcrumb = new ArrayList<>();
    String current = categoryId;
    while (current != null && !current.isBlank()) {
        final String currentId = current;   // <-- copia final para el lambda
        Category cat = categoryRepository.findById(currentId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + currentId));
        breadcrumb.add(0, categoryMapper.toDTO(cat));
        current = cat.getParentId();
    }
    return breadcrumb;
}

    private static int compareDto(CategoryDTO a, CategoryDTO b) {
        int aOrder = a.getSortOrder() != null ? a.getSortOrder() : 0;
        int bOrder = b.getSortOrder() != null ? b.getSortOrder() : 0;
        int cmp = Integer.compare(aOrder, bOrder);
        return cmp != 0 ? cmp : a.getName().compareToIgnoreCase(b.getName());
    }

    private CategoryDTO buildTree(Category c, List<Category> all) {
        CategoryDTO dto = categoryMapper.toDTO(c);
        List<CategoryDTO> children = new ArrayList<>();
        for (Category child : all) {
            if (c.getId().equals(child.getParentId())) {
                children.add(buildTree(child, all));
            }
        }
        children.sort(CategoryServiceImpl::compareDto);
        dto.setChildren(children);
        return dto;
    }

    private String generateSlug(String name) {
        return name.toLowerCase().trim()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
