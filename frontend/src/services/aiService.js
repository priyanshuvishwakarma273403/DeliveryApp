import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY || 'your_api_key_here',
  dangerouslyAllowBrowser: true,
});

export const getGroqResponse = async (messages) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are "FoodIQ AI", the ultimate food expert and delivery assistant. You help people find the best food, give recipe tips, and handle their queries in a fun, intelligent, and very helpful way. Keep your responses concise and food-focused. Mention FoodIQ Gold for premium suggestions.',
        },
        ...messages
      ],
      model: 'llama-3.3-70b-versatile',
    });
    return chatCompletion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error('Groq AI Error:', error);
    return "Oops! My kitchen is currently a bit busy, please try again in a moment! 🍛";
  }
};

/**
 * AI Restaurant Copilot: Analytically diagnoses sales, ratings, refunds, inventory,
 * kitchen load, and staff productivity. Explains root causes and suggests action plans.
 */
export const getCopilotResponse = async (restaurantName, question) => {
  const context = `
You are "FoodIQ Restaurant Copilot", an elite AI operations and business consultant designed by senior staff engineers and data scientists.
You are helping the owner of the restaurant "${restaurantName}" analyze their operations and answer their business question.

Here is the operational context and telemetry data for "${restaurantName}":
- SALES TRENDS: Overall order volume is up 12% week-on-week, but evening orders (7 PM - 10 PM) suffer a 25% drop on rainy days due to driver shortages. Average order value is ₹320.
- RATINGS & REVIEWS: Rating dropped from 4.6 to 4.1 over the last 14 days. Customers complain about cold food, soggy packaging, and late deliveries.
- REFUNDS & DISPUTES: Refund rate spiked to 6.2% of orders (normal is < 1.5%). 78% of refunds are due to "Late Delivery (>50 mins)" or "Incorrect Items Packed".
- CUSTOMER BEHAVIOR: Repeat order rate is 45%. Highest retention is on signature dishes, but new customers ordering appetizers have a low return rate of 12%.
- KITCHEN EFFICIENCY: Average preparation time is 18 minutes. However, during the 8 PM peak, prep time spikes to 32 minutes due to stove bottlenecks and complex menu items (e.g. triple-patty burgers, complex gravies).
- DELIVERY PERFORMANCE: Average delivery partner pick-up delay is 14 minutes because of poor location directions and congested parking near the kitchen. Rain increases delivery times by 68%.
- INVENTORY METRICS: High waste rate of 18% on fresh produce (dairy/lettuce) due to over-ordering on weekdays. Frequent stock-outs of key spices and bread buns on Friday nights.
- STAFF PRODUCTIVITY: Chef A and Chef B prepare 45 orders/day with 98% accuracy. Chef C (new trainee) prepares 20 orders/day with 12% order error rate. Delivery coordination is currently unassigned, causing delay in handing food to riders.

Your goal is to answer the user's question by:
1. Explaining WHY problems occurred (connecting different metrics, e.g., late deliveries caused cold food complaints and spiked refunds).
2. Identifying the ROOT CAUSES (e.g., trainees packing during peak hours, bad rider parking, lack of prep prep during off-peak).
3. Highlighting key TRENDS.
4. Recommending PRACTICAL, ACTIONABLE operational items to improve revenue, customer satisfaction, and efficiency.

Use a professional, highly analytical, and elite consultant tone. Keep the response readable with bullet points and clear, bold headers. Avoid generic advice; refer directly to the telemetry data of "${restaurantName}".
`;

  try {
    if (!import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROQ_API_KEY === 'your_api_key_here') {
      throw new Error("No API key configured");
    }
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: context },
        { role: 'user', content: question }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5
    });
    return chatCompletion.choices[0]?.message?.content || "";
  } catch (error) {
    console.warn('Groq Copilot running local simulation mode:', error.message);
    return getLocalCopilotFallback(restaurantName, question);
  }
};

// High-fidelity local analytics fallback engine
const getLocalCopilotFallback = (restaurantName, question) => {
  const q = question.toLowerCase();
  
  if (q.includes('rating') || q.includes('review') || q.includes('customer complaint') || q.includes('cold')) {
    return `### 🔍 Copilot Operational Audit: Ratings Drop Analysis for **${restaurantName}**

#### **1. The "Why" behind the Drop**
Your average rating plummeted from **4.6 to 4.1** over the last 14 days. The drop is not a food quality issue; it is a downstream logistics issue. Delays in kitchen dispatch combined with poor delivery logistics mean customers are receiving cold food and soggy packaging.

#### **2. Root Causes Identified**
*   **Pick-up Delay Bottleneck**: Delivery riders wait an average of **14 minutes** just to pick up orders due to confusing parking instructions and unassigned handoffs.
*   **Packaging failure**: Standard containers fail to retain heat during transit, leading to soggy burgers/appetizers.
*   **Trainee Chef Error Rate**: Chef C (trainee) has a **12% order error rate**, leading to incorrect meals shipped.

#### **3. Recommendations & Fixes**
*   **Action 1**: Introduce a **Double-Verify Station** before food dispatch. Chef A or B must sign off on packing slips to reduce the 12% error rate.
*   **Action 2**: Switch to **Aluminium-lined double-walled bags** for all hot deliveries.
*   **Action 3**: Designate a **Rider Parking Zone** with a clear QR map to cut pick-up delays from 14 mins to < 4 mins.`;
  }

  if (q.includes('kitchen') || q.includes('prep') || q.includes('efficiency') || q.includes('delay') || q.includes('time')) {
    return `### 🍳 Copilot Operational Audit: Kitchen Efficiency & Prep Bottlenecks

#### **1. Peak Load Stress Explanation**
While your off-peak prep time is excellent (**18 minutes**), it spikes to **32 minutes** at 8 PM. This delay causes riders to wait and drives food refunds up. 

#### **2. Root Causes Identified**
*   **Stove/Station Congestion**: Multi-step menu items require excessive stove time during peak hours.
*   **Trainee Dispatching**: Trainee Chef C is tasked with complex mains during peak rush hours, causing a queue backup.
*   **No Pre-Portioning**: Fresh ingredients are cut on-demand rather than pre-portioned in the afternoon.

#### **3. Recommendations & Fixes**
*   **Action 1**: Implement **Mise-en-place guidelines** between 3:00 PM and 5:00 PM to pre-portion all vegetables and sauces.
*   **Action 2**: Assign Chef C strictly to secondary assembly and appetizer preparation during the 7:30 PM - 9:30 PM peak.
*   **Action 3**: Simplify the peak menu on weekends: temporarily disable low-margin, high-prep-time items.`;
  }

  if (q.includes('refund') || q.includes('dispute') || q.includes('chargeback')) {
    return `### 💸 Copilot Operational Audit: Refund Spikes & Financial Leakage

#### **1. The "Why" behind the Leakage**
Refund rates are currently at **6.2%** of gross sales, which is almost **5x the industry benchmark** (< 1.5%). This is costing you significant net margin.

#### **2. Root Causes Identified**
*   **Late Delivery threshold**: 78% of refunds are triggered automatically because orders exceeded the 50-minute threshold.
*   **Incorrect Items**: Customers dispute charges due to missing items packed by trainee staff.

#### **3. Recommendations & Fixes**
*   **Action 1**: Set up **Order Throttling** inside your dashboard. If preparation times cross 25 minutes, cap incoming orders automatically to avoid late refunds.
*   **Action 2**: Put a physical **Verification Checklist** on the packing counter. Every bag must have a checkmark next to the ordered items.
*   **Action 3**: Partner with local backup courier fleets during rain surges to avoid driver shortages.`;
  }

  if (q.includes('inventory') || q.includes('stock') || q.includes('waste') || q.includes('shortage')) {
    return `### 📦 Copilot Operational Audit: Inventory Optimization & Waste Mitigation

#### **1. The "Why" behind Inventory Costs**
Your restaurant suffers from a dual problem: **18% waste rate** on fresh produce during weekdays, but **critical stock-outs** of main ingredients (buns, spices) during Friday night rushes.

#### **2. Root Causes Identified**
*   **Static Ordering patterns**: You buy the same quantities regardless of weekday/weekend demand.
*   **First-In, First-Out (FIFO) failure**: Trainees cook with newly delivered stock first, leaving older produce to spoil.

#### **3. Recommendations & Fixes**
*   **Action 1**: Adopt a **Split Inventory ordering model**: Order 40% less dairy/lettuce on Monday mornings, and increase bun orders by 50% on Thursday afternoons.
*   **Action 2**: Set up an automated **Low-Stock Trigger alert** linked directly to the supplier API.
*   **Action 3**: Conduct daily 5-minute audits of the walk-in cooler to enforce FIFO sorting.`;
  }

  if (q.includes('staff') || q.includes('productivity') || q.includes('trainee') || q.includes('chef')) {
    return `### 👥 Copilot Operational Audit: Staff Productivity & Resource Allocation

#### **1. Productivity Disparity**
Your kitchen shows a massive gap in throughput: Chef A and B are operating at peak efficiency (**45 orders/day** with **98% accuracy**), while trainee Chef C is operating at **20 orders/day** with a **12% error rate**.

#### **2. Root Causes Identified**
*   **Lack of Training Support**: Chef C has been left alone on station during peak rush without active mentoring.
*   **No Dedicated Hand-off Role**: No staff member is assigned to hand off packaged meals to riders, causing both chefs and riders to wander around the kitchen looking for order bags.

#### **3. Recommendations & Fixes**
*   **Action 1**: Pair Chef C with Chef A during morning shifts for 2 weeks to align on prep speed and layout.
*   **Action 2**: Create a **Handoff Coordinator** role during peak shifts (7 PM - 10 PM) to manage the counter and hand food to riders immediately.
*   **Action 3**: Implement a weekly staff accuracy bonus program to incentivize chefs to maintain a < 1% error rate.`;
  }

  return `### 🚀 Copilot Executive Operational Briefing for **${restaurantName}**

#### **1. Overall Operational Health**
Sales are growing by **12% week-on-week**, indicating strong market demand. However, this growth is stressing your kitchen and delivery operations, leading to a **drop in ratings (to 4.1)** and a **spiked refund rate (6.2%)**.

#### **2. Main Operational Bottlenecks**
*   **Logistical Pick-up Delays**: Riders wait 14 mins because of poor access directions.
*   **Peak Kitchen Spikes**: Prep time rises to 32 mins at 8 PM due to station congestion.
*   **High Food Waste**: Weekday produce spoilage sits at 18% because of static ordering.

#### **3. Recommended Priority Actions**
1.  **Introduce Double-Check Dispatch**: Verify orders to stop wrong items.
2.  **Rider Parking Optimization**: Designate space for delivery partners.
3.  **Smart Roster**: Relocate trainee chefs to prep/appetizer stations during peak dinner hours.

*Ask me specific questions about your **ratings**, **kitchen efficiency**, **refunds**, **inventory**, or **staff productivity** for a deep-dive analysis.*`;
};
