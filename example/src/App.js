import React, { Component } from 'react';
import logo from './logo.svg';
import * as SimpleFlux from 'react-simple-flux'
import './App.css';

class App extends Component {
  state = {val:0}
  componentDidMount(){
    this.props.listen('add', (e,val)=>this.setState({val:val+this.state.val}))
    this.props.listen('addStart', (e,val)=>this.setState({loading:true}))
    this.props.listen('addEnd', (e,val)=>this.setState({loading:false}))
  }
  add = val => this.props.emit('add', val);
  render() {
    return (
      <div className="App">
        <header className="App-header">
          {this.state.loading && <div>
            <img src={logo} className="App-logo" alt="logo" />
            <h1 className="App-title">Loading</h1>
          </div>}
        </header>
        <h2>This use listeners to update state</h2>
        <p className="App-intro">
          <button onClick={this.add.bind(this,-1)}>-</button> <code>{this.state.val}</code> <button onClick={this.add.bind(this,1)}>+</button>
        </p>
        <h2>This Is App Store</h2>
        <code><pre style={{textAlign: 'left'}}>{JSON.stringify(this.props.store,null,2)}</pre></code>
      </div>
    );
  }
}

export default SimpleFlux.withCore(App);
