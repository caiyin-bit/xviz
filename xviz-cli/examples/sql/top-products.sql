-- Top revenue per category × region bucket (for a heatmap).
SELECT customer_region AS region,
       product_category AS category,
       SUM(revenue) AS revenue
FROM orders
GROUP BY 1, 2
ORDER BY 1, 2;
