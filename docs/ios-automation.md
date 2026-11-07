# iOS automation findings

## Sleep Focus oddities

Sleep Focus is special because it is tightly coupled with Apple Health and the sleep schedule.

- **"Waking up" trigger**: This is misleading. It ONLY triggers when your sleep schedule alarm rings or you dismiss the "Good morning" screen.
- **Manual toggle**: Simply turning off Sleep Focus in Control Center does **NOT** fire the "Waking up" automation.
- **Implication**: Sleep Focus is ideal if you have Apple sleep schedule set up already in Apple Health, and you strictly follow your Apple sleep alarm. It is **disappointing** for manual on/off toggling via Control Center.

## Standard focus modes (Personal, Do Not Disturb, custom etc)

Unlike Sleep Focus, these provide reliable "When turning on" and "When turning off" triggers.

- **Recommendation**: If you want manual control (e.g. napping, irregular hours), create a custom "Sleep tracking" focus mode instead of using Apple's default Sleep Focus.

- Toggling them on fires the "Turning on" automation.
- Toggling them off fires the "Turning off" automation immediately.
- They are reliable for manual start/stop tracking if you prefer manual control over Apple's sleep schedule integration.
