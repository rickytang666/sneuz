# ios automation findings

## sleep focus oddities

sleep focus is special because it is tightly coupled with apple health and the sleep schedule.

- **"waking up" trigger**: this is misleading. it ONLY triggers when your sleep schedule alarm rings or you dismiss the "good morning" screen.
- **manual toggle**: simply turning off sleep focus in control center does **NOT** fire the "waking up" automation.
- **implication**: sleep focus is ideal if you have apple sleep schedule set up already in apple health, and you strictly follow your apple sleep alarm. it is **disappointing** for manual on/off toggling via control center.

## standard focus modes (personal, do not disturb, custom etc)

unlike sleep focus, these provide reliable "when turning on" and "when turning off" triggers.

- **recommendation**: if you want manual control (e.g. napping, irregular hours), create a custom "sleep tracking" focus mode instead of using apple's default sleep focus.

- toggling them on fires the "turning on" automation.
- toggling them off fires the "turning off" automation immediately.
- they are reliable for manual start/stop tracking if you prefer manual control over apple's sleep schedule integration.
