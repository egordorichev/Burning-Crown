const globals = require("./globals.js")
const items = require("./items.js").items

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
				let command = exports.commands[args[0]]

				if (command == undefined) {
					message.channel.send("Unknown command")
					return
				}

				message.channel.send(showHelp(args[0], command))
			} else {
				let array = []

				Object.keys(exports.commands).forEach((c) => array.push(showHelp(c, exports.commands[c])))
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

			Object.keys(info.items).forEach((i) => {
        let it = info.items[i]

        if (it > 0) {
  				array.push((it == 1 ? i : `${i} x${it}`) + ` - ${items[i].description}`)
        }
			})

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
      who.turn = false
      info.turn = true

			globals.saveDb()
		}
	},

	bhelp : {
		access : "all",
		description : "Shows hints for battles",
		battle : true,
		run : (args, message) => {
			if (args.length == 1) {
				let command = exports.commands[args[0]]

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

				Object.keys(exports.commands).forEach((c) => {
					if (exports.commands[c].battle) {
						array.push(showHelp(c, exports.commands[c]))
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
			if (!checkTurn(message)) {
				return
			}

			let [info, enemy] = getBattleInfo(message)

			let damage = Math.floor(Math.random() * 5 + 1)
      hit(enemy, info, damage, message)
      takeTurn(message)
			globals.saveDb()
		}
	},

	defend : {
		access : "all",
		description : "Blocks damage from your opponent",
		battle : true,
		run : (args, message) => {
			if (!checkTurn(message)) {
				return
			}

			let [info, enemy] = getBattleInfo(message)

			info.block = true
			info.bchance = Math.floor(Math.random() * 100)

			message.channel.send(`${message.author} puts his :shield: up!`)
			takeTurn(message)
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
      hit(info, checkCreate(message.author), info.max, message)
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
	},

  shop : {
    access : "all",
    description : "Shop for items",
    run : (args, message) => {
      let info = checkCreate(message.author)

      if (info.state == "battle") {
        message.channel.send(`<@${info.id}>, sorry, but we can't trade, while you are fighting!`)
        return
      }

      let array = [ "Today we offer, **JUST FOR YOU**\n" ]

      Object.keys(items).forEach((i) => {
        let it = items[i]
        array.push(`+ **${i}** - ${it.description}, ${it.cost} ${globals.coin}`)
      })

      array.push("\n**GET OUT OF HERE** _or buy these items at lowest prices ever possible!_\nUse `!buy [item name] (count)` to buy things")
      message.channel.send(array.join("\n"))
    }
  },

  buy : {
    access : "all",
    description : "Buys [item] (count) from the shop `!shop`",
    run : (args, message) => {
      if (args.length == 0) {
        message.channel.send("`!buy` [item] (count)")
        return
      }

      let name = args[0]
      let count = 1

      if (args.length > 1) {
        count = parseInt(args[1])

        if (count == undefined || count < 1) {
          message.channel.send(`Invalid item count ${args[1]}`)
          return
        }
      }

      let item = items[name]

      if (item == undefined) {
        message.channel.send(`Unknown item ${name}! Use \`!shop\` for the item list`)
        return
      }

      let cost = item.cost * count
      let info = checkCreate(message.author)

      if (info.coins < cost) {
        message.channel.send(`<@${info.id}>, you have ${info.coins} ${globals.coin}, but thats not enough to buy x${count} ${name}, you need ${cost} ${globals.coin}! :(`)
        return
      }

      message.channel.send(`<@${info.id}> you bought x${count} ${name} for ${cost} ${globals.coin}! Thanks you :money_mouth:`)
      info.coins -= cost

      if (info.items[name] != undefined) {
        info.items[name] += count
      } else {
        info.items[name] = count
      }

      globals.saveDb()
    }
  },

  use : {
    access : "all",
    description : "Use [item] in battle",
    battle : true,
    run : (args, message) => {
      if (!checkTurn(message)) {
        return
      }

      if (args.length != 1) {
        message.channel.send("`!use` [item]")
        return
      }

      let name = args[0]
      let item = items[name]

      if (item == undefined) {
        message.channel.send(`Unknown item ${name}`)
        return
      }

      let [info, enemy] = getBattleInfo(message)

      if (info.items[name] == undefined || info.items[name] == 0) {
        message.channel.send(`${message.author}, you don't have any ${name} in your inventory :x`)
        return
      }

      info.items[name] -= 1

      message.channel.send(`<@${info.id}> uses ${name}!`)

      if (!item.use(info, enemy, message)) {
				takeTurn(message)
			}

      globals.saveDb()
    }
  },

  escape : {
    access : "all",
    description : "Ends the battle",
    battle : true,
    run : (args, message) => {
      if (!checkBattle(message)) {
        return
      }

      let [info, enemy] = getBattleInfo(message)

      info.state = "idle"
      enemy.state = "idle"

      message.channel.send(`<@${enemy.id}>, ${message.author} escaped the battle`)
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
		message.channel.send(`${message.author}, you are currently not in a battle! Use \`!fight [who]\` to start a battle! :skull:`)
		return false
	}

	return true
}

function checkTurn(message) {
  if (!checkBattle(message)) {
    return false
  }

  let info = checkCreate(message.author)

	if (!info.turn) {
		message.channel.send(`${message.author}, it's your opponent turn right now, please wait a bit!`)
		return false
	}

	return true
}

function takeTurn(message) {
  let [info, enemy] = getBattleInfo(message)

  info.turn = !info.turn
  enemy.turn = !enemy.turn

  checkDead(info, enemy, message)
  checkDead(enemy, info, message)

  if (info.state == "dead" && enemy.state == "dead") {
    message.channel.send(`You both are dead, battle is over!`)

    info.hp = info.max
    enemy.state = enemy.max
    info.state = "idle"
    enemy.state = "idle"
    return
  } else if (info.state == "dead" || enemy.state == "dead") {
    message.channel.send(`The battle is over!`)

    if (info.state == "dead") {
      info.hp = info.max
    } else {
      enemy.state = enemy.max
    }

    info.state = "idle"
    enemy.state = "idle"
    return
  }

  message.channel.send(`<@${info.turn ? info.id : enemy.id}>, it's your turn now!`)
}

function checkDead(info, enemy, message) {
  if (info.state != "dead" && enemy.state == "dead") {
    enemy.items = []
    enemy.state = "dead"
    enemy.hp = 0
		info.kills += 1

		let coins = Math.round(enemy.coins / 2)
		enemy.coins = 0
		info.coins += coins

    message.channel.send(`Rest in peace, <@${enemy.id}>, we will never forget you! :skull:\n<@${info.id}> got ${coins} ${globals.coin}!`)

    let c = message.guild.members.get(enemy.id)

    if (c.roles.has(globals.crown.id)) {
      c.removeRole(globals.crown)
      message.member.addRole(globals.crown).catch(console.error)
      message.channel.send(`<@${info.id}> is now the ${globals.crownEmoji} owner! :tada:`)
    }

		saveDb()
  }
}

function hit(enemy, info, damage, message) {
	if (enemy.block) {
		enemy.block = false

		if (enemy.bchance > 50) {
			message.channel.send(`<@${info.id}> hits <@${enemy.id}> for ${damage} :hearts:, but <@${enemy.id}> blocks it! :shield:`)
			return
		}
	}

  enemy.hp -= damage

  if (enemy.hp <= 0) {
    enemy.state = "dead"
    enemy.items = {}
  }

  message.channel.send(`<@${info.id}> hits <@${enemy.id}> for ${damage} :hearts:! :crossed_swords:`)
}

function checkCreate(author, i) {
	let id = i ? author : author.id

	if (globals.base[id] == undefined) {
		globals.base[id] = {
			coins : 0,
			hp : 20,
			max : 20,
			id : id,
			cnt : 0,
      kills : 0,
			name : `${author.username}#${author.discriminator}`,
			items : {},
			state : "idle"
		}

		globals.saveDb()
	}

	return globals.base[id]
}

globals.checkCreate = checkCreate

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