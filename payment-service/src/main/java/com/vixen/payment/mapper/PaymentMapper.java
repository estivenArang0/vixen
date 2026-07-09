package com.vixen.payment.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.vixen.payment.dto.PaymentDTO;
import com.vixen.payment.model.Payment;

@Mapper(componentModel = "spring")
public interface PaymentMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    Payment toEntity(PaymentDTO dto);

    PaymentDTO toDTO(Payment entity);
} 