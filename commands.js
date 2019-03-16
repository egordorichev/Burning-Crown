const globals = require("./globals.js")

exports.commands =  {
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
				let all = message.guild.roles.get(globals.crown.id).members

				if (all != undefined) {
					let membersWithRole = all.forEach(m => {
						m.removeRole(globals.crown).catch(console.error)
					});
				}

				user.addRole(globals.crown).catch(console.error)
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
      let name = who == undefined ? message.author : who
			let array = [ `${name} has ${info.coins} ${globals.coin}, ${info.hp} :hearts:, ${info.kills} :skull:` ]

			if (info.items != undefined) {
				info.items.forEach((i) => {
					array.push(i.count == 1 ? i.name : `${i.name} x${i.count}`)
				})
			}

      let c = message.guild.members.get(info.id)

      if (c.roles.has(globals.crown.id)) {
        array.push(`\n${name} has the ${globals.crownEmoji}!`)
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

			message.channel.send(`${who}, ${message.author} invited you to a battle! Type \`!accept\` to join the battle!`)
			globals.saveDb()
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

			globals.saveDb()
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
        info.kills += 1
				info.coins += coins

        let msg = `<@${info.id}> hits <@${enemy.id}> for ${damage} :hearts:! :crossed_swords:\nRest in peace, <@${enemy.id}>, we will never forget you! :skull:\nYou got ${coins} ${globals.coin}!`
				let c = message.guild.members.get(enemy.id)

				if (c.roles.has(globals.crown.id)) {
					c.removeRole(globals.crown)
					message.member.addRole(globals.crown).catch(console.error)

          msg += `\n\n<@${info.id}> is now the ${globals.crownEmoji} owner! :tada:`
				}

				message.channel.send(mst)
			} else {
				message.channel.send(`<@${info.id}> hits <@${enemy.id}> for ${damage} :hearts:! :crossed_swords:`)
			}

			globals.saveDb()
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

			message.member.removeRole(globals.crown)
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
				message.channel.send(`<@${info.id}>, you have ${info.coins} ${globals.coin}, but thats not enough! :(`)
				return
			}

			info.coins -= count
			enemy.coins += count

			message.channel.send(`<@${info.id}> donated ${count} ${globals.coin} to <@${enemy.id}>! :money_with_wings: :money_mouth:`)

			globals.saveDb()
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

	if (globals.base[id] == undefined) {
		globals.base[id] = {
			coins : 0,
			hp : 50,
			max : 50,
			id : id,
			cnt : 0,
      kills : 0,
			name : `${author.username}#${author.discriminator}`,
			items : [],
			state : "idle"
		}

		globals.saveDb()
	}

	return globals.base[id]
}

function showHelp(name, command) {
	if (command.access == "all") {
		return `${name} - ${command.description}`
	}

	return ""
}

function clean(text) {
  if (typeof(text) === "string") {
    return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203))
  } else {
    return text
	}
}