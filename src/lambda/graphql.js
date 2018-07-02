const { ApolloServer, gql } = require("apollo-server-lambda");
const fetch = require("node-fetch").default;
const { unique } = require("shorthash");
const _ = require("lodash");

console.log(fetch);

const API = "https://dog.ceo/api";

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Query {
    dogs: [Dog]
    dog(breed: String!): Dog
  }

  type Dog {
    id: String!
    breed: String!
    displayImage: String
    images: [Image]
    subbreeds: [String]
  }

  type Image {
    url: String!
    id: String!
  }
`;

const createDog = (subbreeds, breed) => ({
  breed,
  id: unique(breed),
  subbreeds: subbreeds.length > 0 ? subbreeds : null
});

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    dogs: async () => {
      const results = await fetch(`${API}/breeds/list/all`);
      const { message: dogs } = await results.json();

      return _.map(dogs, createDog);
    },
    dog: async (root, { breed }) => {
      const results = await fetch(`${API}/breed/${breed}/list`);
      const { message: subbreeds } = await results.json();

      return createDog(subbreeds, breed);
    }
  },
  Dog: {
    displayImage: async ({ breed }) => {
      const results = await fetch(`${API}/breed/${breed}/images/random`);
      const { message: image } = await results.json();
      return image;
    },
    images: async ({ breed }) => {
      const results = await fetch(`${API}/breed/${breed}/images`);
      const { message: images } = await results.json();
      return images.map(image => ({ url: image, id: unique(image) }));
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers
});

const asHandler = server.createHandler({
  cors: {
    origin: "*",
    credentials: true
  }
});

exports.handler = (...args) => {
  console.log(args[0]);
  return asHandler(...args);
};
