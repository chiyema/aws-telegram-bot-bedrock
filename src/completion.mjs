import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
const bedrock = new BedrockRuntimeClient()

const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT
const MODEL_ID = process.env.MODEL_ID
const MAX_TOKENS = parseInt(process.env.MAX_TOKENS || '100')

/**
 * @param {object} event
 * @param {string} event.text
 * @param {number} event.chat_id
 * @param {string} event.user
 */
export async function handler ({ message, completionPrompt }) {
	let user = message.from.first_name;
	if (message.from.last_name) {
		user += ` ${message.from.last_name}`
	}
	let text = message.text;

	const userContext = `When responding, use the language that user speaks. The User's name is ${user}`

	const prompt = {
		'prompt': `System:${[SYSTEM_PROMPT, userContext, completionPrompt].join('. ')}\n\nHuman:${text}\n\nAssistant:`,
		'max_tokens_to_sample': MAX_TOKENS
	}

	let { body, contentType, $metadata } = await bedrock.send(new InvokeModelCommand({
		modelId: MODEL_ID,
		contentType: 'application/json',
		accept: 'application/json',
		body: JSON.stringify(prompt)
	}))

	body = JSON.parse(Buffer.from(body).toString())
	console.log('metadata', JSON.stringify($metadata))
	console.log('output', contentType, JSON.stringify(body))

	return {
		send: true,
		text: body.completion.trim()
	}
}
