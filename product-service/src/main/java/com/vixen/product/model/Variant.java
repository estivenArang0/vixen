package com.vixen.product.model;

import com.vixen.common.model.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.math.BigDecimal;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@Document(collection = "variants")
@org.springframework.data.elasticsearch.annotations.Document(indexName = "variants")
public class Variant extends BaseEntity {

    @Field(type = FieldType.Keyword)
    private String productId;

    @Field(type = FieldType.Keyword)
    private String sku;

    @Field(type = FieldType.Text)
    private String color;

    @Field(type = FieldType.Keyword)
    private String size;

    @Field(type = FieldType.Double)
    private BigDecimal price;

    @Field(type = FieldType.Double)
    private BigDecimal originalPrice;

    @Field(type = FieldType.Double)
    private Double discountPercentage;

    @Field(type = FieldType.Integer)
    private int stock;

    @Field(type = FieldType.Integer)
    private int reservedStock = 0;

    @Field(type = FieldType.Text)
    private List<String> images;

    @Field(type = FieldType.Boolean)
    private boolean active = true;
}
