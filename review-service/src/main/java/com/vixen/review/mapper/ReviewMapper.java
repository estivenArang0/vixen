package com.vixen.review.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.vixen.review.dto.ReviewDTO;
import com.vixen.review.model.Review;

@Mapper(componentModel = "spring")
public interface ReviewMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    Review toEntity(ReviewDTO dto);

    ReviewDTO toDTO(Review entity);
} 