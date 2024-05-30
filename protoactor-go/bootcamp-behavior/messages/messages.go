package messages

type PlayMovieMessage struct {
	MovieTitle string
	UserID     int
}

type StopMovieMessage struct {
}
