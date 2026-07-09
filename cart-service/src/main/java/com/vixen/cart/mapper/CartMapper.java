package com.vixen.cart.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.vixen.cart.dto.CartDTO;
import com.vixen.cart.model.Cart;

@Mapper(componentModel = "spring")
public interface CartMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    Cart toEntity(CartDTO dto);

    CartDTO toDTO(Cart entity);
} 