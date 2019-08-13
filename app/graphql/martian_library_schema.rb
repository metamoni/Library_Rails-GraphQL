class MartianLibrarySchema < GraphQL::Schema
  query(Types::QueryType)
  mutation(Types::MutationType)
end
