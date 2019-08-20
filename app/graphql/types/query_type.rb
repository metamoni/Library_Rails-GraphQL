module Types
  class QueryType < Types::BaseObject
    # Add root-level fields here.
    # They will be entry points for queries on your schema.

    # TODO: remove me
    field :items,
      [Types::ItemType],
      null: false,
      description: "Returns a list of items in the martian library"

    def items
      Item.preload(:user)
    end
  end
end
