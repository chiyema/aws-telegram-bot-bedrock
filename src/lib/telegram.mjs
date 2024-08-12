const TELEGRAM_API_ENDPOINT = process.env.TELEGRAM_API_ENDPOINT
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_BOT_ID = process.env.TELEGRAM_BOT_ID

/**
 * @param {object} photo 
 * @returns {string}
 */
export async function downloadImage (photo) {
	const fileRes = await fetch(`${TELEGRAM_API_ENDPOINT}/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${photo.file_id}`)
	if (!fileRes.ok) {
		throw new Error(fileRes.statusText)
	}
	const file = await fileRes.json()
	console.log('file', JSON.stringify(file))

	const fileContestRes = await fetch(`${TELEGRAM_API_ENDPOINT}/file/bot${TELEGRAM_BOT_TOKEN}/${file.result.file_path}`)
	if (!fileContestRes.ok) {
		throw new Error(fileContestRes.statusText)
	}

	const body = await fileContestRes.arrayBuffer()
	return Buffer.from(body).toString('base64')
}

export async function extractUser(message) {
	let user = message.from.first_name;
	if (message.from.last_name) {
		user += ` ${message.from.last_name}`
	}
	return user;
}

export async function extractContent(message) {
	const user = await extractUser(message);

	let text = message.text;
	const photo = message.photo;
	let entities = message.entities;
	if (photo) {
		text = message.caption;
		entities = message.caption_entities;
	}

	if (entities?.[0].type === 'bot_command') {
		const commandLength = entities[0].length + 1;

		return {
			extractedCommand: text.substring(0, commandLength),
			extractedText: `${user}: ${text.substring(commandLength)}`,
			extractedPhoto: photo,
			shouldReply: true,
		}
	}

	if (entities?.[0].type === 'mention') {
		const mentionOffset = entities[0].offset;
		const mentionLength = entities[0].length;

		const mentionedEntity = text.substring(mentionOffset + 1, mentionLength);

		if (mentionedEntity === TELEGRAM_BOT_ID) {
			const revisedText = `${user}: ${text.substring(0, mentionOffset)}${text.substring(mentionOffset + mentionLength + 1)}`;
			return {
				extractedText: revisedText,
				extractedPhoto: photo,
				shouldReply: true,
			}
		} else {
			return {
				extractedText: `${user}: ${text}`,
				extractedPhoto: photo,
				shouldReply: false,
			}
		}
	}

	switch (message.chat.type) {
		case 'private':
			return { 
				extractedText: text, 
				extractedPhoto: photo,
				shouldReply: true 
			};
		case 'group':
			return {
				shouldReply: false,
			}
		case 'supergroup':
			// do not send to telegram, but continue generating response and keep as history
			return {
				extractedText: `${user}: ${text}`,
				extractedPhoto: photo,
				shouldReply: false,
			}
	}
}