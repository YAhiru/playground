package actors

import (
	"github.com/YAhiru/playground/protoactor-go/bootcamp-behavior/messages"
	"github.com/asynkron/protoactor-go/actor"
	"github.com/fatih/color"
)

type UserActor struct {
	behavior          actor.Behavior
	currentlyWatching string
}

func NewUserActor() *UserActor {
	println("Creating a UserActor")
	color.Cyan("Setting initial behavior to stopped")
	a := &UserActor{}

	b := actor.NewBehavior()
	b.Become(a.Stopped)
	a.behavior = b

	return a
}

func (state *UserActor) Receive(context actor.Context) {
	state.behavior.Receive(context)
}

func (state *UserActor) Playing(context actor.Context) {
	switch context.Message().(type) {
	case messages.PlayMovieMessage:
		color.Red("Error: cannot start playing another movie before stopping existing one")
	case messages.StopMovieMessage:
		color.Yellow("User has stopped watching '%s'", state.currentlyWatching)
		state.currentlyWatching = ""
		state.behavior.Become(state.Stopped)
	}
	color.Cyan("UserActor behavior has been set to Playing")
}

func (state *UserActor) Stopped(context actor.Context) {
	switch message := context.Message().(type) {
	case messages.PlayMovieMessage:
		state.currentlyWatching = message.MovieTitle
		color.Yellow("User is currently watching '%s'", state.currentlyWatching)
		state.behavior.Become(state.Playing)
	case messages.StopMovieMessage:
		color.Red("Error: cannot stop if nothing is playing")
	}

	color.Cyan("UserActor behavior has been set to Stopped")
}
