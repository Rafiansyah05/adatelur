async function test() {
  const res = await fetch('http://localhost:3000/api/orders/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rak_quantity: 1, fulfillment_method: 'pickup', debug: true })
  });
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}
test();
