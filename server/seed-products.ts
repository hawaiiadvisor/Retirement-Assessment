import { getUncachableStripeClient } from './stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  // Check if product already exists
  const existingProducts = await stripe.products.search({ 
    query: "name:'Retirement Readiness Assessment'" 
  });
  
  if (existingProducts.data.length > 0) {
    console.log('Product already exists:', existingProducts.data[0].id);
    const prices = await stripe.prices.list({ product: existingProducts.data[0].id });
    console.log('Existing price:', prices.data[0]?.id);
    return;
  }

  // Create the Retirement Readiness Assessment product
  const product = await stripe.products.create({
    name: 'Retirement Readiness Assessment',
    description: 'CFP®-designed retirement readiness self-assessment with Monte Carlo simulation and personalized Retirement Readiness Brief.',
    metadata: {
      type: 'assessment',
      features: 'monte_carlo,cfp_designed,personalized_brief'
    }
  });

  console.log('Created product:', product.id);

  // Create the $97 one-time price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 9700, // $97.00 in cents
    currency: 'usd',
    metadata: {
      display_name: 'One-time Assessment'
    }
  });

  console.log('Created price:', price.id);
  console.log('Done! Product and price created successfully.');
}

createProducts().catch(console.error);
