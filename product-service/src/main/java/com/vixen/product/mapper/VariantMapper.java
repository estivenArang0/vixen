package com.vixen.product.mapper;

import com.vixen.product.dto.VariantDTO;
import com.vixen.product.model.Variant;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface VariantMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    Variant toEntity(VariantDTO dto);

    VariantDTO toDTO(Variant entity);
}
