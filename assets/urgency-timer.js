// Urgency Timer Functionality
document.addEventListener('DOMContentLoaded', function() {
  const timers = document.querySelectorAll('[data-urgency-timer]');
  
  timers.forEach(timer => {
    const endTime = parseInt(timer.dataset.endTime) * 1000; // Convert to milliseconds
    const daysEl = timer.querySelector('[data-days]');
    const hoursEl = timer.querySelector('[data-hours]');
    const minutesEl = timer.querySelector('[data-minutes]');
    const secondsEl = timer.querySelector('[data-seconds]');
    
    function updateTimer() {
      const now = new Date().getTime();
      const distance = endTime - now;
      
      if (distance < 0) {
        timer.style.display = 'none';
        return;
      }
      
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
      if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
      if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
      if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
    }
    
    // Update immediately
    updateTimer();
    
    // Update every second
    setInterval(updateTimer, 1000);
  });
});

// Stock Counter Update Functionality
document.addEventListener('DOMContentLoaded', function() {
  // Listen for variant changes
  document.addEventListener('variant:change', function(e) {
    const variantId = e.detail.variant?.id;
    const stockCounters = document.querySelectorAll('[data-stock-counter]');
    
    stockCounters.forEach(counter => {
      if (counter.dataset.variantId == variantId) {
        // Update stock count if needed
        const stockCountEl = counter.querySelector('[data-stock-count]');
        if (stockCountEl && e.detail.variant?.inventory_quantity !== undefined) {
          stockCountEl.textContent = e.detail.variant.inventory_quantity;
          
          // Hide counter if stock is too high
          const threshold = 10; // You can make this configurable
          if (e.detail.variant.inventory_quantity > threshold) {
            counter.style.display = 'none';
          } else {
            counter.style.display = 'flex';
          }
        }
      }
    });
  });
});

// Sticky Add-to-Cart Functionality
document.addEventListener('DOMContentLoaded', function() {
  const stickyCart = document.querySelector('[data-sticky-cart]');
  if (!stickyCart) return;
  
  const addToCartBtn = stickyCart.querySelector('[data-add-to-cart]');
  const scrollToFormBtn = stickyCart.querySelector('[data-scroll-to-form]');
  const priceElement = stickyCart.querySelector('[data-sticky-price]');
  
  // Show/hide sticky cart based on scroll position
  if (stickyCart.classList.contains('sticky-add-to-cart--on-scroll')) {
    const productForm = document.querySelector('form[action*="/cart/add"]');
    
    if (productForm) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            stickyCart.classList.remove('is-visible');
          } else {
            stickyCart.classList.add('is-visible');
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
      });
      
      observer.observe(productForm);
    }
  } else {
    // Always show sticky cart
    stickyCart.classList.add('is-visible');
  }
  
  // Handle add to cart
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', function() {
      const variantId = this.dataset.variantId;
      if (!variantId) return;
      
      this.classList.add('loading');
      
      // Add to cart via Shopify Cart API
      fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          items: [{
            id: variantId,
            quantity: 1
          }]
        })
      })
      .then(response => response.json())
      .then(data => {
        // Dispatch cart updated event
        document.dispatchEvent(new CustomEvent('cart:updated', {
          detail: { count: data.item_count || 0 }
        }));
        
        // Show success feedback
        this.textContent = 'Added!';
        setTimeout(() => {
          this.textContent = 'Add to Cart';
        }, 2000);
      })
      .catch(error => {
        console.error('Error adding to cart:', error);
        this.textContent = 'Error';
        setTimeout(() => {
          this.textContent = 'Add to Cart';
        }, 2000);
      })
      .finally(() => {
        this.classList.remove('loading');
      });
    });
  }
  
  // Handle scroll to form
  if (scrollToFormBtn) {
    scrollToFormBtn.addEventListener('click', function() {
      const productForm = document.querySelector('form[action*="/cart/add"]');
      if (productForm) {
        productForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }
  
  // Update sticky cart when variant changes
  document.addEventListener('variant:change', function(e) {
    const variant = e.detail.variant;
    if (!variant) return;
    
    // Update price
    if (priceElement) {
      if (variant.compare_at_price > variant.price) {
        priceElement.innerHTML = `
          <span class="sticky-add-to-cart__price--sale">${window.Shopify?.formatMoney(variant.price) || variant.price}</span>
          <span class="sticky-add-to-cart__price--compare">${window.Shopify?.formatMoney(variant.compare_at_price) || variant.compare_at_price}</span>
        `;
      } else {
        priceElement.innerHTML = `<span>${window.Shopify?.formatMoney(variant.price) || variant.price}</span>`;
      }
    }
    
    // Update add to cart button
    if (addToCartBtn) {
      addToCartBtn.dataset.variantId = variant.id;
      addToCartBtn.disabled = !variant.available;
      addToCartBtn.textContent = variant.available ? 'Add to Cart' : 'Sold Out';
    }
  });
});