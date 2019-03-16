const Discord = require("discord.js")
const conf = require("./conf.js").conf
const commands = require("./commands.js").commands
const items = require("./items.js").items
const globals = require("./globals.js")

const client = new Discord.Client()

globals.loadDb()

client.on('ready', () => {
  console.log("Connected as " + client.user.tag)
})

client.on('messageReactionAdd', (reaction, user) => {
	if (user != client.user && reaction._emoji.name === "coin") {
		let self = checkCreate(user)
		let who = checkCreate(reaction.message.author)

		if (self != who) {
			if (user != conf.owner && self.coins == 0) {
				reaction.message.channel.send(`<@${self.id}>, you have 0 ${coin}, you can't give them to other! :(`)
				reaction.remove(user)
			} else {
				if (user != conf.owner) {
					self.coins -= 1
				}

				who.coins += 1
				saveDb()
			}
		}
	}
});

client.on('message', (message) => {
  if (message.author == client.user) {
    return
  }

	if (globals.crown == null) {
		globals.crown = message.guild.roles.find(role => role.name === "Burning Crown");
	}

	if (globals.coin == null) {
		globals.coin = client.emojis.find(emoji => emoji.name === "coin");
	}

	if (globals.crownEmoji == null) {
		globals.crownEmoji = client.emojis.find(emoji => emoji.name === "brown");
	}

	if (message.content.startsWith("!")) {
		parseCommand(message)
	} else {
		let user = checkCreate(message.author)
		user.cnt += 1

		if (user.cnt % 10 == 0) {
			user.coins += 1
			// message.react(coin)
			saveDb()
		}
	}
})

function parseCommand(message) {
	let fullCommand = message.content.substr(1)
  let splitCommand = fullCommand.split(" ")
  let cmd = splitCommand[0]
  let args = splitCommand.slice(1)
	let who = message.author

	let command = commands[cmd]

	if (command == undefined) {
		Object.keys(commands).forEach((c) => {
			if (c[0] == cmd[0]) {
				command = commands[c]
			}
		})

		if (command == undefined) {
			message.channel.send(`${who}, I have no idea, what you want from me :x Use !help for more info.`)
			return
		}
	}

	if (command.access == "owner" && who != conf.owner) {
		message.channel.send(`${who}, you are not allowed to run this command, sorry.`)
		return
	}

	command.run(args, message)
}

client.login(conf.secret)