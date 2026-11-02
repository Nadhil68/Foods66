import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Accessibility and Landmark Compliance Contract', () => {
  const indexHtmlPath = path.resolve(__dirname, '../index.html');
  const appTsxPath = path.resolve(__dirname, '../App.tsx');
  const cartTsxPath = path.resolve(__dirname, '../pages/Cart.tsx');
  const aiChatBotTsxPath = path.resolve(__dirname, '../components/AIChatBot.tsx');

  it('verifies index.html has complete SEO, OpenGraph metadata and skip link styles', () => {
    const html = fs.readFileSync(indexHtmlPath, 'utf-8');
    expect(html).toContain('<meta name="description"');
    expect(html).toContain('<link rel="canonical"');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:description"');
    expect(html).toContain('property="og:url"');
    expect(html).toContain('property="og:type"');
    expect(html).toContain('property="og:image"');
    expect(html).toContain('.skip-link');
  });

  it('verifies App.tsx has skip link and main landmark with id="main-content"', () => {
    const app = fs.readFileSync(appTsxPath, 'utf-8');
    expect(app).toContain('href="#main-content"');
    expect(app).toContain('className="skip-link"');
    expect(app).toContain('<main id="main-content"');
  });

  it('verifies Cart.tsx has accessible names, proper form labels, and textarea length limit', () => {
    const cart = fs.readFileSync(cartTsxPath, 'utf-8');
    
    // Check 4 Accessible Form Controls
    expect(cart).toContain('id="coupon-code"');
    expect(cart).toContain('htmlFor="coupon-code"');
    
    expect(cart).toContain('id="payment-card"');
    expect(cart).toContain('htmlFor="payment-card"');
    expect(cart).toContain('id="payment-cod"');
    expect(cart).toContain('htmlFor="payment-cod"');
    
    expect(cart).toContain('id="delivery-instructions"');
    expect(cart).toContain('htmlFor="delivery-instructions"');
    expect(cart).toContain('maxLength={500}');
    expect(cart).toContain('{specialInstructions.length} / 500');

    // Check headings
    expect(cart).toContain('<h1 className="text-3xl font-extrabold');
    expect(cart).toContain('<h2 className="text-xl font-bold');
    expect(cart).toContain('<h3');

    // Check text replacements
    expect(cart).toContain('Quantity: {item.quantity}');
    expect(cart).toContain('GST (Goods and Services Tax');

    // Check accessible buttons
    expect(cart).toContain('aria-label={`Remove ${item.name} from cart`}');
    expect(cart).toContain('aria-label="Apply coupon code"');
    expect(cart).toContain('aria-label="Remove applied coupon"');
  });

  it('verifies AIChatBot.tsx has accessible input label and button aria-labels', () => {
    const aiChat = fs.readFileSync(aiChatBotTsxPath, 'utf-8');
    expect(aiChat).toContain('id="food-ai-question"');
    expect(aiChat).toContain('htmlFor="food-ai-question"');
    expect(aiChat).toContain('aria-label="Send message to Chef AI"');
    expect(aiChat).toContain('aria-label="Close Chef AI Assistant"');
  });
});
