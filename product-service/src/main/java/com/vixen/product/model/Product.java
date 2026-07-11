package com.vixen.product.model;

import com.vixen.common.model.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@EqualsAndHashCode(callSuper = true)
@Document(collection = "products")
@org.springframework.data.elasticsearch.annotations.Document(indexName = "products")
public class Product extends BaseEntity {

    @Field(type = FieldType.Text)
    private String name;

    @Field(type = FieldType.Text)
    private String description;

    @Field(type = FieldType.Keyword)
    private String slug;

    @Field(type = FieldType.Keyword)
    private String categoryId;

    @Field(type = FieldType.Text)
    private List<String> images;

    @Field(type = FieldType.Keyword)
    private String brand;

    @Field(type = FieldType.Double)
    private Double rating;

    @Field(type = FieldType.Integer)
    private Integer reviewCount;

    @Field(type = FieldType.Boolean)
    private boolean active;

    @Field(type = FieldType.Keyword)
    private String sku;

    @Field(type = FieldType.Text)
    private List<String> tags;

    @Field(type = FieldType.Text)
    private List<String> specifications;

    @Field(type = FieldType.Double)
    private BigDecimal minPrice;

    @Field(type = FieldType.Double)
    private BigDecimal maxPrice;

    @Field(type = FieldType.Double)
    private Double weight;

    private Dimensions dimensions;

    private SeoMetadata seo;

    @Field(type = FieldType.Object)
    private Map<String, String> attributes;

    @Data
    public static class SeoMetadata {
        @Field(type = FieldType.Text)
        private String title;

        @Field(type = FieldType.Text)
        private String description;

        @Field(type = FieldType.Text)
        private List<String> keywords;
    }

    @Data
    public static class Dimensions {
        @Field(type = FieldType.Double)
        private Double length;

        @Field(type = FieldType.Double)
        private Double width;

        @Field(type = FieldType.Double)
        private Double height;
    }
}
