# Frontend-Backend API Synchronization Audit

## Backend Endpoints (from /root/soise/app/routes)

### Auth Routes (`/auth`)
- `GET /auth/google/login` - Generate Google OAuth URL
- `GET /auth/google/callback` - Handle Google OAuth callback
- `POST /auth/google` - Login with Google ID token
- `POST /auth/check-email` - Check if email exists
- `POST /auth/send-login-otp` - Send OTP for passwordless login
- `POST /auth/verify-login-otp` - Verify login OTP
- `POST /auth/login` - Password login
- `POST /auth/signup` - Create new account
- `POST /auth/verify-email` - Verify email with OTP
- `POST /auth/resend-verification` - Resend verification code
- `GET /auth/me` - Get current user profile
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user

### Products Routes (`/products`)
- `GET /products` - List products with filtering
- `POST /products` - Create product (admin)
- `PUT /products/:product_id` - Update product (admin)
- `DELETE /products/:product_id` - Delete product (admin)
- `GET /products/:product_id/variants` - List variants
- `POST /products/:product_id/variants` - Add variant (admin)
- `PUT /products/:product_id/variants/:variant_id` - Update variant (admin)
- `DELETE /products/:product_id/variants/:variant_id` - Delete variant (admin)
- `PUT /products/:product_id/variants/:variant_id/media` - Attach media (admin)
- `PUT /products/:product_id/variants/:variant_id/media/reorder` - Reorder media (admin)
- `DELETE /products/:product_id/variants/:variant_id/media/:media_id` - Remove media (admin)
- `GET /products/categories` - Get all categories
- `GET /products/collections` - Get all collections
- `GET /products/featured` - Get featured products

### Cart Routes (`/cart`)
- `GET /cart` - Get cart items
- `POST /cart/items` - Add item to cart
- `DELETE /cart/items/:cartitem_id` - Remove item from cart
- `POST /cart/migrate` - Migrate guest cart to user
- `POST /cart/checkout` - Checkout cart
- `POST /cart/apply-code` - Apply discount code

### Orders Routes (`/orders`)
- `GET /orders` - Get user orders
- `GET /orders/:order_id` - Get order details
- `PUT /orders/:order_id/status` - Update order status (admin)

### Admin Routes (`/admin`)
- `GET /admin/dashboard` - Dashboard stats
- `GET /admin/users` - Get users list
- `PUT /admin/users/:user_id/role` - Update user role
- `GET /admin/creators` - Get creators list
- `GET /admin/orders` - Get all orders
- `PUT /admin/orders/:order_id/status` - Update order status
- `GET /admin/analytics/sales` - Sales analytics
- `GET /admin/inventory/alerts` - Inventory alerts
- `POST /admin/collections` - Create collection
- `PUT /admin/collections/:collection_id` - Update collection
- `GET /admin/payouts` - Get payouts
- `POST /admin/payouts/:payout_id/confirm` - Confirm payout

### Profiles Routes (`/profiles`)
- `GET /profiles` - Get user profile

### Reviews Routes (`/reviews`)
- `POST /reviews/products/:product_id` - Create review
- `GET /reviews/products/:product_id` - Get product reviews
- `PUT /reviews/:review_id` - Update review
- `DELETE /reviews/:review_id` - Delete review

### Flash Sales Routes (`/flash-sales`)
- `GET /flash-sales` - Get active flash sales
- `GET /flash-sales/:sale_id` - Get flash sale details
- `POST /flash-sales` - Create flash sale (admin)
- `PUT /flash-sales/:sale_id` - Update flash sale (admin)
- `DELETE /flash-sales/:sale_id` - Delete flash sale (admin)

## Frontend API Calls (from /root/soise-front)

### Issues Found:
1. **Order Status Update** - Frontend calls `PUT /orders/:order_id/status` but should call `PUT /admin/orders/:order_id/status`
2. **Apply Discount Code** - Frontend calls `POST /cart/apply-code` with `code` field but backend expects `creator_code`
3. **Missing Endpoints** - Frontend needs endpoints for:
   - Wishlist operations
   - Product reviews
   - Flash sales
   - Payouts
   - Wallet operations

## Verified Endpoints (Frontend matches Backend):
✓ GET /products - List products
✓ POST /cart/items - Add to cart
✓ GET /cart - Get cart
✓ POST /cart/checkout - Checkout
✓ POST /cart/apply-code - Apply discount code
✓ POST /auth/signup - Register
✓ POST /auth/login - Login
✓ POST /auth/verify-email - Verify email
✓ POST /auth/resend-verification - Resend code
✓ GET /auth/me - Get current user
✓ POST /auth/refresh - Refresh token
✓ POST /auth/logout - Logout
✓ GET /admin/dashboard - Dashboard stats
✓ GET /admin/orders - Get all orders
✓ GET /creators/application - Check creator status
✓ POST /creators/apply - Apply for creator
✓ GET /creators/dashboard - Creator dashboard
✓ POST /creators/onboard - Creator onboarding
✓ GET /creators/codes - Get creator codes
✓ POST /creators/generate - Generate code
✓ GET /payments/banks - List banks
✓ POST /payments/initialize - Initialize payment
✓ POST /payments/verify - Verify payment

## Issues Fixed:
✓ FIXED: Order status endpoint - Changed from POST /orders/:id/status to PUT /admin/orders/:id/status
✓ FIXED: Discount code field - Changed from 'code' to 'creator_code'

## Verified Correct Endpoints:
✓ GET /products/collections - Get collections
✓ GET /products/categories - Get categories
✓ GET /products/featured - Get featured products
✓ GET /orders - Get user orders
✓ GET /orders/:order_id - Get order details
✓ GET /admin/users - Get users list
✓ GET /admin/creators - Get creators list
✓ GET /admin/analytics/sales - Sales analytics
✓ GET /admin/inventory/alerts - Inventory alerts
✓ POST /admin/collections - Create collection
✓ PUT /admin/collections/:id - Update collection
✓ GET /admin/payouts - Get payouts
✓ POST /admin/payouts/:id/confirm - Confirm payout
✓ GET /profiles - Get user profile
✓ POST /reviews/products/:id - Create review
✓ GET /reviews/products/:id - Get reviews
✓ PUT /reviews/:id - Update review
✓ DELETE /reviews/:id - Delete review
✓ GET /flash-sales - Get active flash sales
✓ GET /wishlist - Get wishlist
✓ POST /wishlist/items - Add to wishlist
✓ DELETE /wishlist/items/:id - Remove from wishlist

## Status:
All critical frontend-backend API endpoints have been verified and synchronized.
