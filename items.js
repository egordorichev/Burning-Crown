const globals = require("./globals.js")

exports.items = {
  small_health_potion : {
    cost : 3,
    description : ":hearts: Heals a bit",
    use : (who, enemy, message) => {
      who.hp += 5
    }
  },

  health_potion : {
    cost : 6,
    description : ":two_hearts: Heals",
    use : (who, enemy, message) => {
      who.hp += 10
    }
  },

  big_health_potion : {
    cost : 10,
    description : ":two_hearts: :two_hearts: Heals a lot",
    use : (who, enemy, message) => {
      who.hp += 20
    }
  },

	bomb : {
		cost : 3,
		description : ":bomb: Kaboom",
		use : (who, enemy, message) => {
			let a = Math.floor(Math.random() * 5 + 5)
			let b = Math.floor(Math.random() * 5 + 5)

			hit(enemy, a)
			hit(who, b)

			message.channel.send(`A :bomb: :boom: explodes, hitting <@${who.id}> for ${a} :hearts: and <@${enemy.id}> for ${b} :hearts:`)
		}
	},

	atomic_bomb : {
		cost : 30,
		description : ":atom: :bomb: Kaboooooooooooom",
		use : (who, enemy, message) => {
			let a = 1000000
			let b = 1000000

			hit(enemy, a)
			hit(who, b)

			message.channel.send(`:boom: :boom: :boom:\nAn :atom: :bomb: :boom: explodes, hitting <@${who.id}> for ${a} :hearts: and <@${enemy.id}> for ${b} :hearts:, and ripping their bodies into pieces`)
		}
	},

  dice : {
    cost : 3,
    description : ":game_die: Deals damage to someone",
    use : (who, enemy, message) => {
			let en = Math.random() > 0.5
			let dmg = Math.floor(Math.random() * 5 + 5)

			if (en) {
				hit(enemy, dmg)
			} else {
				hit(who, dmg)
			}

			message.channel.send(`:game_die: rolls and hits <@${en ? enemy.id : who.id}> for ${dmg} :hearts:!`)
    }
  },

	d8 : {
		cost : 10,
		description : ":8ball: Uses a random item",
		use : (who, enemy, message) => {
			let keys = Object.keys(exports.items)
			let name = keys[Math.floor(Math.random() * keys.length)]
			let item = exports.items[name]

      message.channel.send(`:8ball: uses ${name} on <@${who.id}>!`)
      item.use(who, enemy, message)
		}
	},

	d24 : {
		cost : 25,
		description : ":8ball: :8ball: :8ball: Uses 3 random items",
		use : (who, enemy, message) => {
			for (var i = 0; i < 3; i++) {
				let keys = Object.keys(exports.items)
				let name = keys[Math.floor(Math.random() * keys.length)]
				let item = exports.items[name]

	      message.channel.send(`:8ball: uses ${name} on <@${who.id}>!`)
	      item.use(who, enemy, message)
			}
		}
	},

	thief_dagger : {
		cost : 1,
		description : ":dagger: Steals coins from your opponent",
		use : (who, enemy, message) => {
			let amount = Math.min(enemy.coins, Math.floor(Math.random() * 10 + 1))

			if (amount == 0) {
				message.channel.send(`<@${enemy.id}> has no coins :(`)
				return
			}

			who.coins += amount
			enemy.coins -= amount

			message.channel.send(`<@${who.id}> steals ${amount} ${globals.coin} from <@${enemy.id}>!`)
		}
	}
}

function hit(who, damage) {
	who.hp -= damage

  if (who.hp <= 0) {
		who.hp = 0
		who.state = "dead"
    who.items = {}
  }
}