package com.vixen.product.model;

import com.vixen.common.model.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Data
@EqualsAndHashCode(callSuper = true)
@Document(collection = "categories")
public class Category extends BaseEntity {

    @Field(type = FieldType.Text)
    private String name;

    @Field(type = FieldType.Keyword)
    private String slug;

    @Field(type = FieldType.Keyword)
    private String parentId;

    @Field(type = FieldType.Integer)
    private Integer level;

    @Field(type = FieldType.Integer)
    private Integer sortOrder;

    @Field(type = FieldType.Text)
    private String image;

    @Field(type = FieldType.Boolean)
    private boolean active = true;

    @Field(type = FieldType.Text)
    private String description;
}
