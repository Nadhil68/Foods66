# FOODS66 — Testing Checklist

> **Note:** Functional testing on Android device/emulator is currently blocked because the Android SDK setup is in progress. This checklist documents the expected tests and their status once the app can run.

## Static Analysis
- [x] `flutter analyze` — **No issues found**

## Unit/Widget Tests
- [x] `flutter test` — **All tests passed** (1/1)

## Functional Testing (Requires Running App)

### Authentication
- [ ] Registration (new user)
- [ ] Login (existing user)
- [ ] Logout
- [ ] Invalid login (wrong password)
- [ ] Token persistence (app restart)

### Food Browsing
- [ ] Home screen loads
- [ ] Category filtering
- [ ] Food listing
- [ ] Food detail view
- [ ] Search functionality
- [ ] Restaurant listing
- [ ] Restaurant detail

### Cart
- [ ] Add food to cart
- [ ] Increase quantity
- [ ] Decrease quantity
- [ ] Remove item
- [ ] Clear cart
- [ ] Cart total calculation

### Checkout & Orders
- [ ] Enter delivery address
- [ ] Select payment method (COD)
- [ ] Apply coupon
- [ ] Place order
- [ ] Order confirmation dialog
- [ ] Order history listing
- [ ] Active vs past orders
- [ ] Order detail view
- [ ] Order cancellation
- [ ] Order timeline

### Profile
- [ ] View profile
- [ ] Edit profile (name, phone)
- [ ] Change password
- [ ] Logout

### Favorites
- [ ] Add to favorites
- [ ] Remove from favorites
- [ ] View favorites list

## Edge Case Testing
- [ ] No internet connection — app shows error, doesn't crash
- [ ] API unavailable — app shows error, doesn't crash
- [ ] Empty food list — empty state UI shown
- [ ] Empty cart — appropriate message shown
- [ ] Invalid food ID — graceful handling
- [ ] Expired JWT token — redirects to login
- [ ] Long food/restaurant names — text overflow handled

## Security Testing
- [x] No API keys in source code
- [x] No database credentials in source code
- [x] No hardcoded passwords
- [x] JWT token stored in secure storage
- [x] localhost properly isolated to development only
