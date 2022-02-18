import { Component } from 'react';
import Button from '@mui/material/Button';

export class Spoiler extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: props.show || false
    };
    this.toggle = this.toggle.bind(this);
  }

  toggle(e) {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    this.setState({ show: !this.state.show });
  }

  render() {
    const Tag = this.props.tag || "div";
    return (
      <Tag className={
        `${this.props.className} react-spoiler ${
          this.state.show ? 'react-spoiler-shown' : 'react-spoiler-hidden'
        }`
      } {...this.props}>
        {this.state.show ? this.props.children : (
          <Button variant="contained" className={
              `${this.props.buttonClassName} react-spoiler-button ${
                this.state.show ? 'react-spoiler-shown' : 'react-spoiler-hidden'
              }`
          } onClick={this.toggle}>
            { this.props.hiddenText || 'Click to show' }
          </Button>
        )}
      </Tag>
    )
  }
}