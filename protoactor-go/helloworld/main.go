package main

import (
	"github.com/asynkron/protoactor-go/actor"
	"time"
)

func main() {

	// Creating an Actor System
	system := actor.NewActorSystem()

	// Starting the Actor
	props := actor.PropsFromProducer(func() actor.Actor {
		return &HelloWorldActor{}
	})
	pid := system.Root.Spawn(props)

	// Sending a Message
	system.Root.Send(pid, &Hello{Who: "World"})
	time.Sleep(1 * time.Second)
}

// Defining Messages

type Hello struct {
	Who string
}

// Creating an Actor

type HelloWorldActor struct {
}

func (state *HelloWorldActor) Receive(context actor.Context) {
	switch msg := context.Message().(type) {
	case *Hello:
		println("Hello ", msg.Who)
	}
}
