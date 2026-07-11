package com.vixen.product.controller;

import com.vixen.common.exception.UnauthorizedException;
import com.vixen.common.response.ApiResponse;
import com.vixen.product.dto.CategoryDTO;
import com.vixen.product.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@Tag(name = "Category Controller", description = "APIs for managing product categories")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "Get all categories or category tree")
    public ResponseEntity<ApiResponse<List<CategoryDTO>>> getAllCategories(
            @RequestParam(value = "tree", defaultValue = "false") boolean tree) {
        if (tree) {
            return ResponseEntity.ok(ApiResponse.success(categoryService.getCategoryTree()));
        }
        return ResponseEntity.ok(ApiResponse.success(categoryService.getAllCategories()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a category by ID")
    public ResponseEntity<ApiResponse<CategoryDTO>> getCategoryById(@PathVariable String id) {
        return categoryService.getCategoryById(id)
                .map(ApiResponse::success)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/children")
    @Operation(summary = "Get direct children of a category")
    public ResponseEntity<ApiResponse<List<CategoryDTO>>> getChildren(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getChildren(id)));
    }

    @GetMapping("/{id}/breadcrumb")
    @Operation(summary = "Get breadcrumb path from root to the category")
    public ResponseEntity<ApiResponse<List<CategoryDTO>>> getBreadcrumb(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getBreadcrumb(id)));
    }

    @PostMapping
    @Operation(summary = "Create a new category")
    public ResponseEntity<ApiResponse<CategoryDTO>> createCategory(
            @Valid @RequestBody CategoryDTO categoryDTO,
            @RequestHeader(value = "X-User-Roles", required = false) String userRoles) {
        if (userRoles == null || !userRoles.contains("ROLE_ADMIN")) {
            throw new UnauthorizedException("No autorizado: se requiere rol de administrador");
        }
        return ResponseEntity.ok(ApiResponse.success(categoryService.createCategory(categoryDTO)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing category")
    public ResponseEntity<ApiResponse<CategoryDTO>> updateCategory(
            @PathVariable String id,
            @Valid @RequestBody CategoryDTO categoryDTO,
            @RequestHeader(value = "X-User-Roles", required = false) String userRoles) {
        if (userRoles == null || !userRoles.contains("ROLE_ADMIN")) {
            throw new UnauthorizedException("No autorizado: se requiere rol de administrador");
        }
        return ResponseEntity.ok(ApiResponse.success(categoryService.updateCategory(id, categoryDTO)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a category")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Roles", required = false) String userRoles) {
        if (userRoles == null || !userRoles.contains("ROLE_ADMIN")) {
            throw new UnauthorizedException("No autorizado: se requiere rol de administrador");
        }
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
