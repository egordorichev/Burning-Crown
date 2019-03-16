const Discord = require("discord.js")
const fs = require("fs")
const conf = require("./conf.js").conf

const client = new Discord.Client()
const base = JSON.parse(fs.readFileSync("base.json"))

const commands = {
	eval : {
		access : "owner",
		description : "Runs js code",
		run : (args, message) => {
			try {
				const code = args.join(" ")
				let evaled = eval(code)

				if (typeof evaled !== "string") {
					evaled = require("util").inspect(evaled)
				}

				message.channel.send(clean(evaled), { code : "xl" });
			} catch (e) {
				message.channel.send(`\`Error\` \`\`\`xl\n${clean(e)}\n\`\`\``);
			}
		}
	},

	random : {
		access : "all",
		description : "Tags random person",
		run : (args, message) => {
			message.channel.send(`${message.guild.members.random().user.toString()}, you are the one!`)
		}
	},

	online : {
		access : "all",
		description : "Counts all people online",
		run : (args, message) => {
			let i = 0
			onlineMembers = message.guild.members.filter(member => member.presence.status === "online" || member.presence.status === "idle" || member.presence.status === "dnd")
			onlineMembers.forEach(m => { i++ })
			message.channel.send(`A total of ${i} cool peps are online!`)
		}
	},

	ronline : {
		access : "all",
		description : "Tags random person online",
		run : (args, message) => {
			onlineMembers = message.guild.members.filter(member => member.presence.status === "online" || member.presence.status === "idle" || member.presence.status === "dnd")
			message.channel.send(`${onlineMembers.random().user.toString()}, you are the one!`)
		}
	},

	crown : {
		access : "owner",
		description : "Gives the crown to a person",
		run : (args, message) => {
			let user = args.length > 0 ? message.mentions.members.first() : message.member;

			if (user == undefined) {
				message.channel.send("Unknown user")
			} else {
				let all = message.guild.roles.get(crown.id).members

				if (all != undefined) {
					let membersWithRole = all.forEach(m => {
						m.removeRole(crown).catch(console.error)
					});
				}

				user.addRole(crown).catch(console.error)
			}
		}
	},

	help : {
		access : "all",
		description : "Halp",
		run : (args, message) => {
			if (args.length == 1) {
				let command = commands[args[0]]

				if (command == undefined) {
					message.channel.send("Unknown command")
					return
				}

				message.channel.send(showHelp(args[0], command))
			} else {
				let array = []

				Object.keys(commands).forEach((c) => array.push(showHelp(c, commands[c])))
				message.channel.send(array.join("\n"))
			}
		}
	},

	inventory : {
		access : "all",
		description : "Shows your inventory",
		run : (args, message) => {
			let who = message.mentions.members.first()
			let info = who == undefined ? checkCreate(message.author) : checkCreate(who.user)
			let array = [ `${who == undefined ? message.author + " has" : who + " has"} ${info.coins} ${coin} and ${info.hp} :hearts:` ]

			if (info.items != undefined) {
				info.items.forEach((i) => {
					array.push(i.count == 1 ? i.name : `${i.name} x${i.count}`)
				})
			}

			message.channel.send(array.join("\n"))
		}
	},

	fight : {
		access : "all",
		description : "Starts a fight with [who]",
		battle : true,
		run : (args, message) => {
			let who = message.mentions.members.first()

			if (who == undefined) {
				message.channel.send("You did not mention the person, that you want to fight")
				return
			}

			let info = checkCreate(message.author)
			let enemy = checkCreate(who.user)

			if (enemy.state == "battle") {
				message.channel.send(`${who} is currently in another battle.`)
				return
			}

			if (info.state == "battle") {
				message.channel.send(`You are currently in another battle.`)
				return
			}

			info.state = "await"
			enemy.opponent = info.id
			info.opponent = enemy.id

			message.channel.send(`${who}, ${message.author} invited you to a battle! Type !accept to join the battle!`)
			saveDb()
		}
	},

	accept : {
		access : "all",
		description : "Accept invation to a battle",
		battle : true,
		run : (args, message) => {
			let info = checkCreate(message.author)

			if (info.opponent == undefined) {
				message.channel.send(`No one invited you to a battle! Use \`!fight [who]\` to invite someone!`)
				return
			}

			let who = checkCreate(info.opponent, true)
			message.channel.send(`<@${info.id}>, <@${who.id}> accepted your invite! PREPARE TO DIE! :skull:\n_(use \`!bhelp\` for battle help)_`)

			who.opponent = info.id
			info.opponent = who.id
			who.state = "battle"
			info.state = "battle"

			saveDb()
		}
	},

	bhelp : {
		access : "all",
		description : "Shows hints for battles",
		battle : true,
		run : (args, message) => {
			if (args.length == 1) {
				let command = commands[args[0]]

				if (command == undefined) {
					message.channel.send("Unknown command")
					return
				}

				if (!command.battle) {
					message.channel.send("That command is not battle related, use ``!help` instead")
					return
				}

				message.channel.send(showHelp(command))
			} else {
				let array = []

				Object.keys(commands).forEach((c) => {
					if (commands[c].battle) {
						array.push(showHelp(c, commands[c]))
					}
				})

				message.channel.send(array.join("\n"))
			}
		}
	},

	attack : {
		access : "all",
		description : "Attacks your opponent",
		battle : true,
		run : (args, message) => {
			if (!checkBattle(message)) {
				return
			}

			let [info, enemy] = getBattleInfo(message)

			let damage = Math.floor(Math.random() * 5 + 5)
			enemy.hp -= damage

			if (enemy.hp <= 0) {
				enemy.hp = enemy.max
				enemy.state = "idle"
				info.state = "idle"
				enemy.items = []

				let coins = Math.round(enemy.coins / 2)
				enemy.coins = 0
				info.coins += coins
				// todo: pass the crown, if had it


				let c = message.guild.members.get(enemy.id)
				console.log(c)
// message.member.roles.has(crown.id)
				if (c.roles.has(crown.id)) {
					c.removeRole(crown)
					message.member.addRole(crown).catch(console.error)
				}

				message.channel.send(`<@${info.id}> hits <@${enemy.id}> for ${damage} :hearts:! :crossed_swords:\nRest in peace, <@${enemy.id}>, we will never forget you! :skull:\nYou got ${coins} ${coin}!`)
			} else {
				message.channel.send(`<@${info.id}> hits <@${enemy.id}> for ${damage} :hearts:! :crossed_swords:`)
			}

			saveDb()
		}
	},

	kill : {
		access : "owner",
		description : "RIP",
		run : (args, message) => {
			let who = message.mentions.members.first()

			if (who == undefined) {
				return
			}

			let info = checkCreate(who.user)
			info.hp = info.max
			info.coins = 0
			info.items = []
			info.state = "idle"

			message.member.removeRole(crown)
			message.channel.send(`<@${info.id}> was killed by ~~dark magic~~ 1s and 0s :eyes:`)
		}
	},

	donate : {
		access : "all",
		description : "Donate to [who] [amount] coins",
		run : (args, message) => {
			let who = message.mentions.members.first()

			if (who == undefined) {
				message.channel.send("You did not mention the person, that you want to donate")
				return
			}

			let count = args.length == 2 ? parseInt(args[1]) : undefined

			if (count == undefined) {
				message.channel.send("You did not say, how much you want to donate")
				return
			}

			let info = checkCreate(message.author)
			let enemy = checkCreate(who.user)

			if (count > info.coins) {
				message.channel.send(`<@${info.id}>, you have ${info.coins} ${coin}, but thats not enough! :(`)
				return
			}

			info.coins -= count
			enemy.coins += count

			message.channel.send(`<@${info.id}> donated ${count} ${coin} to <@${enemy.id}>! :money_with_wings: :money_mouth:`)

			saveDb()
		}
	}
}

function getBattleInfo(message) {
	let info = checkCreate(message.author)
	let enemy = checkCreate(info.opponent, true)

	return [info, enemy]
}

function checkBattle(message) {
	let info = checkCreate(message.author)

	if (info.state != "battle") {
		message.channel.send("You are currently not in a battle! Use `!fight [who]` to start a battle! :skull:")
		return false
	}

	return true
}

function checkCreate(author, i) {
	let id = i ? author : author.id

	if (base[id] == undefined) {
		base[id] = {
			coins : 0,
			hp : 50,
			max : 50,
			id : id,
			cnt : 0,
			name : `${author.username}#${author.discriminator}`,
			items : [],
			state : "idle"
		}

		saveDb()
	}

	return base[id]
}

function showHelp(name, command) {
	if (command.access == "all") {
		return `${name} - ${command.description}`
	}

	return ""
}

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

let crown
let coin

client.on('message', (message) => {
  if (message.author == client.user) {
    return
  }

	if (crown == null) {
		crown = message.guild.roles.find(role => role.name === "Burning Crown");
	}

	if (coin == null) {
		coin = client.emojis.find(emoji => emoji.name === "coin");
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

function clean(text) {
  if (typeof(text) === "string") {
    return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203))
  } else {
    return text
	}
}

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

function saveDb() {
	fs.writeFileSync("base.json", JSON.stringify(base, null, 4))
}

client.login(conf.secret)