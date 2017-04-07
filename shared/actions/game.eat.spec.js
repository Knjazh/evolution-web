import {Map, List} from 'immutable';

import {GameModel, PHASE} from '../models/game/GameModel';
import {CardModel} from '../models/game/CardModel';
import * as cardTypes from '../models/game/evolution/cards';
import * as traits from '../models/game/evolution/traits';
import {AnimalModel} from '../models/game/evolution/AnimalModel';
import {TraitModel} from '../models/game/evolution/TraitModel';

import {
  gameTakeFoodRequest
  , gameEndTurnRequest
  , gameActivateTraitRequest
} from '../actions/actions';

describe('Game (EAT PHASE):', function () {
  it('Simple eating', () => {
    const [{serverStore, ServerGame, CreateGame}, {clientStore0, User0, ClientGame0}, {clientStore1, User1, ClientGame1}] = mockGame(2);
    CreateGame({
      players: {
        [User0.id]: {continent: [
          AnimalModel.new(CardModel.new(cardTypes.CardCamouflage))
          , AnimalModel.new(CardModel.new(cardTypes.CardCamouflage))
        ]}
        , [User1.id]: {continent: [
          AnimalModel.new(CardModel.new(cardTypes.CardCamouflage))
          , AnimalModel.new(CardModel.new(cardTypes.CardCamouflage))
        ]}
      }
      , food: 2
      , status: {
        turn: 0
        , round: 0
        , player: 0
        , phase: PHASE.EAT
      }
    });

    expectUnchanged(() => clientStore1.dispatch(gameTakeFoodRequest(ClientGame1().getPlayerAnimal(User1, 0).id)), serverStore, clientStore1);
    expectUnchanged(() => clientStore1.dispatch(gameEndTurnRequest()), serverStore, clientStore1);

    clientStore0.dispatch(gameTakeFoodRequest(ClientGame0().getPlayerAnimal(User0, 0).id));

    expectUnchanged(() => clientStore0.dispatch(gameTakeFoodRequest(ClientGame0().getPlayerAnimal(User0, 0).id)), serverStore, clientStore0);

    clientStore0.dispatch(gameEndTurnRequest());

    expect(ServerGame().food).equal(1);
    expect(ClientGame0().food).equal(1);
    expect(ClientGame1().food).equal(1);
    expect(ServerGame().getPlayerAnimal(User0, 0).food).equal(1);
    expect(ClientGame0().getPlayerAnimal(User0, 0).food).equal(1);
    expect(ClientGame1().getPlayerAnimal(User0, 0).food).equal(1);

    clientStore1.dispatch(gameEndTurnRequest());

    expect(ServerGame().food, 'Players dont take food when skip turns //TODO').equal(1);

    expectUnchanged(() => clientStore0.dispatch(gameTakeFoodRequest(ClientGame0().getPlayerAnimal(User0, 0).id)), serverStore, clientStore0);

    clientStore0.dispatch(gameTakeFoodRequest(ClientGame0().getPlayerAnimal(User0, 1).id));

    expect(ServerGame().food).equal(0);
    expect(ServerGame().getPlayerAnimal(User0, 0).food).equal(1);
    expect(ServerGame().getPlayerAnimal(User0, 1).food).equal(1);
  });

  it('Increased eating', () => {
    const [{serverStore, ServerGame, CreateGame}, {clientStore0, User0, ClientGame0}, {clientStore1, User1, ClientGame1}] = mockGame(2);
    CreateGame({
      players: {
        [User0.id]: {continent: [
          AnimalModel.new().set('traits', List.of(TraitModel.new(traits.TraitCarnivorous)))
        ]}
        , [User1.id]: {continent: []}
      }
      , food: 10
      , status: {
        turn: 0
        , round: 0
        , player: 0
        , phase: PHASE.EAT
      }
    });

    clientStore0.dispatch(gameTakeFoodRequest(ClientGame0().getPlayerAnimal(User0, 0).id));
    clientStore0.dispatch(gameEndTurnRequest());
    clientStore1.dispatch(gameEndTurnRequest());
    clientStore0.dispatch(gameTakeFoodRequest(ClientGame0().getPlayerAnimal(User0, 0).id));
    clientStore0.dispatch(gameEndTurnRequest());

    expect(ServerGame().getPlayerAnimal(User0, 0).food).equal(2);
    expect(ServerGame().food).equal(8);
  });

  it('Hunting', () => {
    const [{serverStore, ServerGame, CreateGame}, {clientStore0, User0, ClientGame0}, {clientStore1, User1, ClientGame1}] = mockGame(2);
    CreateGame({
      players: {
        [User0.id]: {continent: [
          AnimalModel.new(CardModel.new(cardTypes.CardCamouflage)).set('traits', List.of(TraitModel.new(traits.TraitCarnivorous)))
          , AnimalModel.new(CardModel.new(cardTypes.CardCamouflage)).set('traits', List.of(TraitModel.new(traits.TraitCarnivorous)))
          , AnimalModel.new(CardModel.new(cardTypes.CardCamouflage)).set('traits', List.of(TraitModel.new(traits.TraitCarnivorous)))
        ]}
        , [User1.id]: {continent: [
          AnimalModel.new(CardModel.new(cardTypes.CardCamouflage)).set('traits', List.of(TraitModel.new(traits.TraitCarnivorous)))
          , AnimalModel.new(CardModel.new(cardTypes.CardCamouflage)).set('traits', List.of(TraitModel.new(traits.TraitCarnivorous)))
          , AnimalModel.new(CardModel.new(cardTypes.CardCamouflage)).set('traits', List.of(TraitModel.new(traits.TraitCarnivorous)))
        ]}
      }
      , food: 10
      , status: {
        turn: 0
        , round: 0
        , player: 0
        , phase: PHASE.EAT
      }
    });

    clientStore0.dispatch(gameActivateTraitRequest(
      ClientGame0().getPlayerAnimal(User0, 0).id
      , ClientGame0().getPlayerAnimal(User0, 0).traits.get(0).type
      , ClientGame0().getPlayerAnimal(User1, 0).id
    ));

    expect(ServerGame().food).equal(10);
    expect(ServerGame().getPlayerAnimal(User0, 0).food).equal(2);
    expect(ServerGame().getPlayerAnimal(User0, 0).food).equal(2);
    expect(ServerGame().players.get(User1).continent.size).equal(2);
  });
});