package com.vixen.product.controller;

import com.vixen.common.exception.UnauthorizedException;
import com.vixen.common.response.ApiResponse;
import com.vixen.product.dto.VariantDTO;
import com.vixen.product.service.VariantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/variants")
@RequiredArgsConstructor
@Tag(name = "Variant Controller", description = "APIs for managing product variants")
public class VariantController {

    private final VariantService variantService;

    @GetMapping("/product/{productId}")
    @Operation(summary = "Get all variants of a product")
    public ResponseEntity<ApiResponse<List<VariantDTO>>> getVariantsByProduct(@PathVariable String productId) {
        return ResponseEntity.ok(ApiResponse.success(variantService.getVariantsByProduct(productId)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a variant by ID")
    public ResponseEntity<ApiResponse<VariantDTO>> getVariantById(@PathVariable String id) {
        return variantService.getVariantById(id)
                .map(ApiResponse::success)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/sku/{sku}")
    @Operation(summary = "Get a variant by SKU")
    public ResponseEntity<ApiResponse<VariantDTO>> getVariantBySku(@PathVariable String sku) {
        return variantService.getVariantBySku(sku)
                .map(ApiResponse::success)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Create a new variant")
    public ResponseEntity<ApiResponse<VariantDTO>> createVariant(
            @Valid @RequestBody VariantDTO variantDTO,
            @RequestHeader(value = "X-User-Roles", required = false) String userRoles) {
        if (userRoles == null || !userRoles.contains("ROLE_ADMIN")) {
            throw new UnauthorizedException("No autorizado: se requiere rol de administrador");
        }
        return ResponseEntity.ok(ApiResponse.success(variantService.createVariant(variantDTO)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing variant")
    public ResponseEntity<ApiResponse<VariantDTO>> updateVariant(
            @PathVariable String id,
            @Valid @RequestBody VariantDTO variantDTO,
            @RequestHeader(value = "X-User-Roles", required = false) String userRoles) {
        if (userRoles == null || !userRoles.contains("ROLE_ADMIN")) {
            throw new UnauthorizedException("No autorizado: se requiere rol de administrador");
        }
        return ResponseEntity.ok(ApiResponse.success(variantService.updateVariant(id, variantDTO)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a variant")
    public ResponseEntity<ApiResponse<Void>> deleteVariant(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Roles", required = false) String userRoles) {
        if (userRoles == null || !userRoles.contains("ROLE_ADMIN")) {
            throw new UnauthorizedException("No autorizado: se requiere rol de administrador");
        }
        variantService.deleteVariant(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/{id}/stock")
    @Operation(summary = "Update variant stock")
    public ResponseEntity<ApiResponse<VariantDTO>> updateStock(
            @PathVariable String id,
            @RequestParam int quantity,
            @RequestHeader(value = "X-User-Roles", required = false) String userRoles) {
        if (userRoles == null || !userRoles.contains("ROLE_ADMIN")) {
            throw new UnauthorizedException("No autorizado: se requiere rol de administrador");
        }
        return ResponseEntity.ok(ApiResponse.success(variantService.updateStock(id, quantity)));
    }

    @PutMapping("/{id}/reserve")
    @Operation(summary = "Reserve stock for a variant")
    public ResponseEntity<ApiResponse<VariantDTO>> reserveStock(
            @PathVariable String id,
            @RequestParam int quantity,
            @RequestHeader(value = "X-User-Roles", required = false) String userRoles) {
        if (userRoles == null || !userRoles.contains("ROLE_ADMIN")) {
            throw new UnauthorizedException("No autorizado: se requiere rol de administrador");
        }
        return ResponseEntity.ok(ApiResponse.success(variantService.reserveStock(id, quantity)));
    }

    @PutMapping("/{id}/release")
    @Operation(summary = "Release reserved stock for a variant")
    public ResponseEntity<ApiResponse<VariantDTO>> releaseStock(
            @PathVariable String id,
            @RequestParam int quantity,
            @RequestHeader(value = "X-User-Roles", required = false) String userRoles) {
        if (userRoles == null || !userRoles.contains("ROLE_ADMIN")) {
            throw new UnauthorizedException("No autorizado: se requiere rol de administrador");
        }
        return ResponseEntity.ok(ApiResponse.success(variantService.releaseStock(id, quantity)));
    }
}
