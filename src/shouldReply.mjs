import { extractContent } from './lib/telegram.mjs'

export async function handler({ message }) {
	const { shouldReply } = await extractContent(message);

    return {
        shouldReply,
    }
}