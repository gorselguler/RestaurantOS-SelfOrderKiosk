import { supabase } from '../lib/supabaseClient';

/**
 * Populates the database with a realistic Kebab House test menu
 * and standard JSONB customizations for the specified restaurant_id.
 * 
 * @param {string} restaurantId - The target restaurant UUID
 * @returns {Promise<{ success: boolean, categoriesCount: number, itemsCount: number, error?: string }>}
 */
export async function seedKebabTestMenu(restaurantId) {
  if (!restaurantId) {
    throw new Error('Restaurant ID bulunamadı. Lütfen giriş yaptığınızdan emin olun.');
  }

  console.log(`🌱 Seeding Kebab Test Menu for restaurant: ${restaurantId}`);

  try {
    // =========================================================================
    // STEP 1: Insert Categories & Capture their returned IDs
    // =========================================================================
    const categoriesPayload = [
      {
        restaurant_id: restaurantId,
        name: { tr: 'Döner Sandviçler', en: 'Döner in Bread', pl: 'Kebab w Bułce' },
        icon: 'Utensils',
        sort_order: 1
      },
      {
        restaurant_id: restaurantId,
        name: { tr: 'Döner Dürümler', en: 'Döner Wraps', pl: 'Kebab w Tortilli (Rollo)' },
        icon: 'Utensils',
        sort_order: 2
      },
      {
        restaurant_id: restaurantId,
        name: { tr: 'Porsiyon & Tabaklar', en: 'Portions & Plates', pl: 'Dania Talerzowe' },
        icon: 'ChefHat',
        sort_order: 3
      },
      {
        restaurant_id: restaurantId,
        name: { tr: 'Yan Ürünler', en: 'Sides', pl: 'Dodatki' },
        icon: 'Layers',
        sort_order: 4
      },
      {
        restaurant_id: restaurantId,
        name: { tr: 'İçecekler', en: 'Drinks', pl: 'Napoje' },
        icon: 'Coffee',
        sort_order: 5
      }
    ];

    const { data: createdCategories, error: catError } = await supabase
      .from('categories')
      .insert(categoriesPayload)
      .select('id, name, sort_order')
      .order('sort_order', { ascending: true });

    if (catError) {
      console.error('❌ Error inserting categories:', catError);
      throw catError;
    }

    if (!createdCategories || createdCategories.length < 5) {
      throw new Error('Kategoriler oluşturulamadı.');
    }

    const catBreadId = createdCategories[0].id;
    const catWrapId = createdCategories[1].id;
    const catPlateId = createdCategories[2].id;
    const catSidesId = createdCategories[3].id;
    const catDrinksId = createdCategories[4].id;

    console.log('✅ Categories created successfully:', createdCategories);

    // =========================================================================
    // STEP 2: Insert Menu Items (With JSONB Customizations)
    // =========================================================================
    const menuItemsPayload = [
      // Item 1: Classic Chicken Döner Sandwich (Category 1)
      {
        restaurant_id: restaurantId,
        category_id: catBreadId,
        name: {
          tr: 'Klasik Tavuk Döner Sandviç',
          en: 'Classic Chicken Döner Sandwich',
          pl: 'Klasyczny Kebab z Kurczakiem w Bułce'
        },
        description: {
          tr: 'Taze fırınlanmış susamlı tombik ekmekte marine yaprak tavuk döner, taze marul, domates, mor lahana ve özel soslar.'
        },
        price: 22.00,
        image_url: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&auto=format&fit=crop&q=80',
        preparation_time_minutes: 5,
        is_available: true,
        is_featured: true,
        customizations: [
          {
            id: 'c1',
            name: 'Ingredients (Remove)',
            type: 'multiple',
            required: false,
            maxSelections: 4,
            options: [
              { id: 'opt_c1_1', name: 'No Onion', price: 0 },
              { id: 'opt_c1_2', name: 'No Tomato', price: 0 },
              { id: 'opt_c1_3', name: 'No Cabbage', price: 0 }
            ]
          },
          {
            id: 'c2',
            name: 'Sauces',
            type: 'single',
            required: true,
            maxSelections: 1,
            options: [
              { id: 'opt_c2_1', name: 'Garlic Sauce', price: 0 },
              { id: 'opt_c2_2', name: 'Spicy Sauce', price: 0 },
              { id: 'opt_c2_3', name: 'Mixed Sauce', price: 0 }
            ]
          },
          {
            id: 'c3',
            name: 'Extras',
            type: 'multiple',
            required: false,
            maxSelections: 3,
            options: [
              { id: 'opt_c3_1', name: 'Extra Chicken', price: 6.00 },
              { id: 'opt_c3_2', name: 'Extra Cheese', price: 4.00 },
              { id: 'opt_c3_3', name: 'Jalapenos', price: 2.00 }
            ]
          }
        ]
      },

      // Item 2: Beef Kebab Durum / Wrap (Category 2)
      {
        restaurant_id: restaurantId,
        category_id: catWrapId,
        name: {
          tr: 'Dana Kebap Dürüm / Wrap',
          en: 'Beef Kebab Durum / Wrap',
          pl: 'Kebab Wołowy Rollo / Tortilla'
        },
        description: {
          tr: 'İncecik çıtır lavaş ekmeğinde özel baharatlarla pişmiş yaprak dana döner, taze yeşillikler ve seçeceğiniz soslar.'
        },
        price: 28.00,
        image_url: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=80',
        preparation_time_minutes: 5,
        is_available: true,
        is_featured: true,
        customizations: [
          {
            id: 'c1',
            name: 'Ingredients (Remove)',
            type: 'multiple',
            required: false,
            maxSelections: 4,
            options: [
              { id: 'opt_c1_1', name: 'No Onion', price: 0 },
              { id: 'opt_c1_2', name: 'No Tomato', price: 0 },
              { id: 'opt_c1_3', name: 'No Cabbage', price: 0 }
            ]
          },
          {
            id: 'c2',
            name: 'Sauces',
            type: 'single',
            required: true,
            maxSelections: 1,
            options: [
              { id: 'opt_c2_1', name: 'Garlic Sauce', price: 0 },
              { id: 'opt_c2_2', name: 'Spicy Sauce', price: 0 },
              { id: 'opt_c2_3', name: 'Mixed Sauce', price: 0 }
            ]
          },
          {
            id: 'c3',
            name: 'Extras',
            type: 'multiple',
            required: false,
            maxSelections: 3,
            options: [
              { id: 'opt_c3_1', name: 'Extra Beef', price: 8.00 },
              { id: 'opt_c3_2', name: 'Extra Cheese', price: 4.00 },
              { id: 'opt_c3_3', name: 'Jalapenos', price: 2.00 }
            ]
          }
        ]
      },

      // Item 3: Iskender Kebab Plate (Category 3)
      {
        restaurant_id: restaurantId,
        category_id: catPlateId,
        name: {
          tr: 'İskender Kebap Tabağı',
          en: 'Iskender Kebab Plate',
          pl: 'Iskender Kebab na Talerzu'
        },
        description: {
          tr: 'Kızarmış tırnak pide yatağında ince yaprak dana eti, tereyağlı özel domates sosu, közlenmiş biber ve süzme yoğurt ile.'
        },
        price: 42.00,
        image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80',
        preparation_time_minutes: 8,
        is_available: true,
        is_featured: true,
        customizations: [
          {
            id: 'c4',
            name: 'Preferences',
            type: 'multiple',
            required: false,
            maxSelections: 2,
            options: [
              { id: 'opt_c4_1', name: 'Extra Butter', price: 3.00 },
              { id: 'opt_c4_2', name: 'Extra Yogurt', price: 4.00 }
            ]
          }
        ]
      },

      // Item 4: French Fries (Category 4)
      {
        restaurant_id: restaurantId,
        category_id: catSidesId,
        name: {
          tr: 'Çıtır Patates Kızartması',
          en: 'French Fries',
          pl: 'Frytki Chrupiące'
        },
        description: {
          tr: 'Altın sarısı çıtır patates kızartması, özel baharat çeşnisi ve dilediğiniz sos seçenekleri.'
        },
        price: 10.00,
        image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=80',
        preparation_time_minutes: 4,
        is_available: true,
        is_featured: false,
        customizations: [
          {
            id: 'c5',
            name: 'Portion Size',
            type: 'single',
            required: true,
            maxSelections: 1,
            options: [
              { id: 'opt_c5_1', name: 'Standard', price: 0 },
              { id: 'opt_c5_2', name: 'Large', price: 4.00 }
            ]
          },
          {
            id: 'c6',
            name: 'Sauces',
            type: 'multiple',
            required: false,
            maxSelections: 2,
            options: [
              { id: 'opt_c6_1', name: 'Ketchup', price: 1.50 },
              { id: 'opt_c6_2', name: 'Mayonnaise', price: 1.50 },
              { id: 'opt_c6_3', name: 'Garlic Sauce', price: 2.00 }
            ]
          }
        ]
      },

      // Item 5: Ayran (Category 5)
      {
        restaurant_id: restaurantId,
        category_id: catDrinksId,
        name: {
          tr: 'Geleneksel Ayran (300ml)',
          en: 'Ayran',
          pl: 'Ayran Turecki (300ml)'
        },
        description: {
          tr: 'Geleneksel soğuk yayık ayranı, ferahlatıcı lezzet.'
        },
        price: 6.00,
        image_url: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop&q=80',
        preparation_time_minutes: 1,
        is_available: true,
        is_featured: false,
        customizations: []
      }
    ];

    const { data: createdItems, error: itemsError } = await supabase
      .from('menu_items')
      .insert(menuItemsPayload)
      .select('id, name, price, customizations');

    if (itemsError) {
      console.error('❌ Error inserting menu items:', itemsError);
      throw itemsError;
    }

    console.log('🎉 Menu items created successfully:', createdItems);

    return {
      success: true,
      categoriesCount: createdCategories.length,
      itemsCount: createdItems.length
    };
  } catch (err) {
    console.error('❌ Failed to seed Kebab test menu:', err);
    throw err;
  }
}
