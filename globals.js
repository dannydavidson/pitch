// define models
var db = Meteor.db = {};
db.session = new Meteor.Collection( 'session' );
db.states = new Meteor.Collection( 'states' );
db.gigs = new Meteor.Collection( 'gigs' );
db.education = new Meteor.Collection( 'education' );

// define streams
var streams = Meteor.streams = {};
streams.presence = new Meteor.Stream( 'presence' );

// define namespace for shared methods and set constants
Meteor.pitch = {
	pingInterval: 1 * 3000,
	cleanupCoefficient: 2,
	numFailedPingsAllowed: 1
};
