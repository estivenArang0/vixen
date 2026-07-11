import { baseApi } from '../../api/baseApi';
import type { ApiResponse, Page } from '../../api/apiTypes';
import type { ProductDTO, CategoryDTO, VariantDTO } from './productsTypes';

const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Product endpoints ────────────────────────────────────────────────
    getProducts: builder.query<ProductDTO[], void>({
      query: () => '/products/active',
      transformResponse: (response: ApiResponse<ProductDTO[]>) => response.data,
      providesTags: ['Products'],
    }),
    getAllProducts: builder.query<ProductDTO[], void>({
      query: () => '/products',
      transformResponse: (response: ApiResponse<ProductDTO[]>) => response.data,
      providesTags: ['Products'],
    }),
    getProductById: builder.query<ProductDTO, string>({
      query: (id) => `/products/${id}`,
      transformResponse: (response: ApiResponse<ProductDTO>) => response.data,
      providesTags: (_result, _error, id) => [{ type: 'Product', id }],
    }),
    getProductBySlug: builder.query<ProductDTO, string>({
      query: (slug) => `/products/slug/${slug}`,
      transformResponse: (response: ApiResponse<ProductDTO>) => response.data,
      providesTags: (_result, _error, slug) => [{ type: 'Product', id: slug }],
    }),
    getProductsPage: builder.query<Page<ProductDTO>, { page: number; size: number }>({
      query: ({ page, size }) => `/products/page?page=${page}&size=${size}`,
      transformResponse: (response: ApiResponse<Page<ProductDTO>>) => response.data,
      providesTags: ['Products'],
    }),
    getProductsByCategory: builder.query<ProductDTO[], string>({
      query: (categoryId) => `/products/category/${categoryId}`,
      transformResponse: (response: ApiResponse<ProductDTO[]>) => response.data,
      providesTags: ['Products'],
    }),
    getProductsByBrand: builder.query<ProductDTO[], string>({
      query: (brand) => `/products/brand/${brand}`,
      transformResponse: (response: ApiResponse<ProductDTO[]>) => response.data,
      providesTags: ['Products'],
    }),
    createProduct: builder.mutation<ProductDTO, Partial<ProductDTO>>({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      transformResponse: (response: ApiResponse<ProductDTO>) => response.data,
      invalidatesTags: ['Products'],
    }),
    updateProduct: builder.mutation<ProductDTO, { id: string; body: Partial<ProductDTO> }>({
      query: ({ id, body }) => ({ url: `/products/${id}`, method: 'PUT', body }),
      transformResponse: (response: ApiResponse<ProductDTO>) => response.data,
      invalidatesTags: (_result, _error, { id }) => ['Products', { type: 'Product', id }],
    }),
    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Products'],
    }),
    updateStock: builder.mutation<void, { id: string; quantity: number }>({
      query: ({ id, quantity }) => ({
        url: `/products/${id}/stock?quantity=${quantity}`,
        method: 'PUT',
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Product', id }],
    }),

    // ─── Category endpoints ──────────────────────────────────────────────
    getCategories: builder.query<CategoryDTO[], void>({
      query: () => '/categories',
      transformResponse: (response: ApiResponse<CategoryDTO[]>) => response.data,
      providesTags: ['Categories'],
    }),
    getCategoryTree: builder.query<CategoryDTO[], void>({
      query: () => '/categories/tree',
      transformResponse: (response: ApiResponse<CategoryDTO[]>) => response.data,
      providesTags: ['Categories'],
    }),
    getCategoryById: builder.query<CategoryDTO, string>({
      query: (id) => `/categories/${id}`,
      transformResponse: (response: ApiResponse<CategoryDTO>) => response.data,
      providesTags: (_result, _error, id) => [{ type: 'Category', id }],
    }),
    createCategory: builder.mutation<CategoryDTO, Partial<CategoryDTO>>({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      transformResponse: (response: ApiResponse<CategoryDTO>) => response.data,
      invalidatesTags: ['Categories'],
    }),
    updateCategory: builder.mutation<CategoryDTO, { id: string; body: Partial<CategoryDTO> }>({
      query: ({ id, body }) => ({ url: `/categories/${id}`, method: 'PUT', body }),
      transformResponse: (response: ApiResponse<CategoryDTO>) => response.data,
      invalidatesTags: (_result, _error, { id }) => ['Categories', { type: 'Category', id }],
    }),
    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Categories'],
    }),
    getBreadcrumb: builder.query<CategoryDTO[], string>({
      query: (categoryId) => `/categories/${categoryId}/breadcrumb`,
      transformResponse: (response: ApiResponse<CategoryDTO[]>) => response.data,
    }),

    // ─── Variant endpoints ───────────────────────────────────────────────
    getVariantsByProduct: builder.query<VariantDTO[], string>({
      query: (productId) => `/products/${productId}/variants`,
      transformResponse: (response: ApiResponse<VariantDTO[]>) => response.data,
      providesTags: (_result, _error, productId) => [{ type: 'Variants', id: productId }],
    }),
    getVariantById: builder.query<VariantDTO, string>({
      query: (id) => `/variants/${id}`,
      transformResponse: (response: ApiResponse<VariantDTO>) => response.data,
      providesTags: (_result, _error, id) => [{ type: 'Variant', id }],
    }),
    createVariant: builder.mutation<VariantDTO, Partial<VariantDTO>>({
      query: (body) => ({ url: '/variants', method: 'POST', body }),
      transformResponse: (response: ApiResponse<VariantDTO>) => response.data,
      invalidatesTags: ['Variants'],
    }),
    updateVariant: builder.mutation<VariantDTO, { id: string; body: Partial<VariantDTO> }>({
      query: ({ id, body }) => ({ url: `/variants/${id}`, method: 'PUT', body }),
      transformResponse: (response: ApiResponse<VariantDTO>) => response.data,
      invalidatesTags: (_result, _error, { id }) => ['Variants', { type: 'Variant', id }],
    }),
    deleteVariant: builder.mutation<void, string>({
      query: (id) => ({ url: `/variants/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Variants'],
    }),
    updateVariantStock: builder.mutation<void, { id: string; quantity: number }>({
      query: ({ id, quantity }) => ({
        url: `/variants/${id}/stock`,
        method: 'PUT',
        body: { quantity },
      }),
      invalidatesTags: ['Variants'],
    }),
  }),
});

export const {
  // Products
  useGetProductsQuery,
  useGetAllProductsQuery,
  useGetProductByIdQuery,
  useGetProductBySlugQuery,
  useGetProductsPageQuery,
  useGetProductsByCategoryQuery,
  useGetProductsByBrandQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUpdateStockMutation,
  // Categories
  useGetCategoriesQuery,
  useGetCategoryTreeQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetBreadcrumbQuery,
  // Variants
  useGetVariantsByProductQuery,
  useGetVariantByIdQuery,
  useCreateVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
  useUpdateVariantStockMutation,
} = productsApi;
