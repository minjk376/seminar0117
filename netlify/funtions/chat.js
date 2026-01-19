export default async (req) => {
try {
const { message } = await req.json();


const response = await fetch(
'https://api.openai.com/v1/responses',
{
method: 'POST',
headers: {
'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
'Content-Type': 'application/json',
},
body: JSON.stringify({
model: 'gpt-4o-mini',
input: message,
}),
}
);


const data = await response.json();


return new Response(
JSON.stringify({ reply: data.output[0].content[0].text }),
{ headers: { 'Content-Type': 'application/json' } }
);
} catch (error) {
return new Response(
JSON.stringify({ error: 'OpenAI 요청 실패' }),
{ status: 500 }
);
}
};